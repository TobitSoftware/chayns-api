const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.test' });
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });
global.IS_REACT_ACT_ENVIRONMENT = true;

const { act, createElement, StrictMode } = require('react');
const { createRoot } = require('react-dom/client');
const { ChaynsContext } = require('../dist/cjs/components/ChaynsContext');
const { useSafeArea, useSafeAreaListener } = require('../dist/cjs/hooks/useSafeArea');
const { AppName, HingeStatus } = require('../dist/cjs/types/IChaynsReact');
const { AppWrapper } = require('../dist/cjs/wrapper/AppWrapper');
const { normalizeFunctions } = require('../dist/cjs/wrapper/normalizeFunctions');

const insets = { top: 12, left: 17, bottom: 20, right: 43 };
let wrapper;
let nativeCalls;
let listenerIds;
let root;
let currentValue;

// The native host only retains the most recently registered callback for call 300.
const emit = (value) => {
    const call = nativeCalls.filter((entry) => entry.action === 300).at(-1);
    const callbackName = call.value.callback.replace(/^window\./, '');
    window[callbackName]({ retVal: value });
};

const subscribe = async (callback) => {
    const id = await wrapper.functions.addAppleSafeAreaListener(callback);
    listenerIds.push(id);
    return id;
};

const Probe = ({ enabled }) => {
    currentValue = useSafeArea({ enabled });
    return null;
};

const renderHook = async (enabled = true) => {
    root ??= createRoot(document.createElement('div'));
    await act(async () => {
        root.render(createElement(StrictMode, null, createElement(ChaynsContext.Provider, { value: wrapper }, createElement(Probe, { enabled }))));
    });
};

beforeEach(() => {
    const testDom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.test' });
    global.window = testDom.window;
    global.document = testDom.window.document;
    Object.defineProperty(global, 'navigator', { configurable: true, value: testDom.window.navigator });
    wrapper = new AppWrapper();
    wrapper.values = { device: { os: 'iOS', app: { name: AppName.Sidekick, appVersion: 2120 } } };
    nativeCalls = [];
    listenerIds = [];
    root = undefined;
    currentValue = undefined;
    window.webkit = { messageHandlers: { jsonCall: { postMessage: (json) => nativeCalls.push(JSON.parse(json)) } } };
});

afterEach(async () => {
    if (root) await act(async () => root.unmount());
    for (const id of listenerIds) await wrapper.functions.removeAppleSafeAreaListener(id);
    for (const key of Object.keys(window)) {
        if (key.startsWith('chaynsApiV5Callback_')) delete window[key];
    }
    window.close();
});

test('exports the three native hinge status values through the public entry point', () => {
    assert.deepEqual(HingeStatus, { Closed: 'closed', PartiallyOpen: 'partiallyOpen', FullyOpen: 'fullyOpen' });
    assert.equal(require('../dist/cjs').HingeStatus, HingeStatus);
});

for (const hingeStatus of Object.values(HingeStatus)) {
    test(`preserves ${hingeStatus} and a zero angle in a direct safe-area request`, async () => {
        const expected = { ...insets, hingeAngle: 0, hingeStatus };
        const pending = wrapper.functions.getAppleSafeArea();
        assert.equal(nativeCalls[0].action, 300);
        emit({ ...expected, unrelated: 'ignored' });
        assert.deepEqual(await pending, expected);
        assert.deepEqual(await wrapper.functions.getAppleSafeArea(), expected);
        assert.equal(nativeCalls.length, 1);
    });
}

test('keeps ordinary iPhones free of hinge properties in requests and listener updates', async () => {
    const pending = wrapper.functions.getAppleSafeArea();
    emit(insets);
    assert.deepEqual(await pending, insets);
    const values = [];
    await subscribe((value) => values.push(value));
    emit(insets);
    assert.deepEqual(values, [insets, insets]);
    assert.equal(Object.hasOwn(values[1], 'hingeAngle'), false);
    assert.equal(Object.hasOwn(values[1], 'hingeStatus'), false);
});

test('retains the existing zero-inset fallback for an absent native response', async () => {
    const pending = wrapper.functions.getAppleSafeArea();
    emit(undefined);
    assert.deepEqual(await pending, { top: 0, left: 0, bottom: 0, right: 0 });
});

test('updates the listener cache and new subscribers when only hinge metadata changes', async () => {
    const values = [];
    await subscribe((value) => values.push(value));
    for (const hingeStatus of Object.values(HingeStatus)) {
        const expected = { ...insets, hingeAngle: 90, hingeStatus };
        emit(expected);
        assert.deepEqual(values.at(-1), expected);
        assert.deepEqual(await wrapper.functions.getAppleSafeArea(), expected);
    }
    const replay = [];
    await subscribe((value) => replay.push(value));
    assert.deepEqual(replay, [values.at(-1)]);
    assert.equal(nativeCalls.length, 1);
});

test('stops delivering native updates to removed listeners', async () => {
    const values = [];
    const id = await subscribe((value) => values.push(value));
    await wrapper.functions.removeAppleSafeAreaListener(id);
    listenerIds = [];
    emit({ ...insets, hingeAngle: 90, hingeStatus: HingeStatus.PartiallyOpen });
    assert.deepEqual(values, []);
});

test('passes hinge updates through the existing compatibility fallback unchanged', async () => {
    let dispatch;
    const functions = normalizeFunctions({
        invokeCall: (options, callback) => {
            assert.equal(options.action, 300);
            dispatch = callback;
            return Promise.resolve();
        },
    });
    const values = [];
    const id = await functions.addAppleSafeAreaListener((value) => values.push(value));
    const expected = { ...insets, hingeAngle: 90, hingeStatus: HingeStatus.PartiallyOpen };
    dispatch(expected);
    assert.deepEqual(values, [expected]);
    assert.deepEqual(await functions.getAppleSafeArea(), expected);
    await functions.removeAppleSafeAreaListener(id);
    dispatch({ ...expected, hingeStatus: HingeStatus.FullyOpen });
    assert.deepEqual(values, [expected]);
});

test('updates the actual hook through native folding events with identical insets', async () => {
    await renderHook();
    for (const hingeStatus of Object.values(HingeStatus)) {
        const expected = { ...insets, hingeAngle: 90, hingeStatus };
        await act(async () => emit(expected));
        assert.deepEqual(currentValue, expected);
    }
    assert.equal(nativeCalls.length, 1);
    const beforeCleanup = currentValue;
    await renderHook(false);
    emit({ ...insets, hingeAngle: 0, hingeStatus: HingeStatus.Closed });
    assert.equal(currentValue, beforeCleanup);
    await renderHook();
    assert.deepEqual(currentValue, { ...insets, hingeAngle: 0, hingeStatus: HingeStatus.Closed });
    assert.equal(nativeCalls.length, 1);
});

test('returns only insets on ordinary devices and retains disabled-hook behavior', async () => {
    await renderHook(false);
    assert.deepEqual(currentValue, { top: 0, left: 0, bottom: 0, right: 0 });
    assert.equal(nativeCalls.length, 0);
    await renderHook();
    await act(async () => emit(insets));
    assert.deepEqual(currentValue, insets);
});

test('does not register native listeners on unsupported runtimes', async () => {
    wrapper.values.device.os = 'Android';
    await renderHook();
    assert.equal(nativeCalls.length, 0);
    assert.deepEqual(currentValue, { top: 0, left: 0, bottom: 0, right: 0 });
});


test('shares one persistent callback between a listener and concurrent initial getters', async () => {
    const values = [];
    await subscribe((value) => values.push(value));
    const first = wrapper.functions.getAppleSafeArea();
    const second = wrapper.functions.getAppleSafeArea();
    assert.equal(nativeCalls.length, 1);
    const closed = { ...insets, hingeAngle: 0, hingeStatus: HingeStatus.Closed };
    emit(closed);
    assert.deepEqual(await Promise.all([first, second]), [closed, closed]);
    const open = { ...insets, right: 0, hingeAngle: 180, hingeStatus: HingeStatus.FullyOpen };
    emit(open);
    assert.deepEqual(values, [closed, open]);
    assert.deepEqual(await wrapper.functions.getAppleSafeArea(), open);
});

test('keeps the stream alive after a getter initializes it and after all listeners leave', async () => {
    const pending = wrapper.functions.getAppleSafeArea();
    emit(insets);
    await pending;
    const values = [];
    const id = await subscribe((value) => values.push(value));
    await wrapper.functions.removeAppleSafeAreaListener(id);
    const latest = { ...insets, right: 0, hingeStatus: HingeStatus.PartiallyOpen };
    emit(latest);
    const replay = [];
    await subscribe((value) => replay.push(value));
    assert.deepEqual(values, [insets]);
    assert.deepEqual(replay, [latest]);
    assert.equal(nativeCalls.length, 1);
});

test('shares the native safe-area channel across AppWrapper instances', async () => {
    const firstValues = [];
    await subscribe((value) => firstValues.push(value));
    emit(insets);
    const second = new AppWrapper();
    // Avoid the separate generic callback counter collision in the old implementation.
    second.counter = 100;
    const secondValues = [];
    const id = await second.functions.addAppleSafeAreaListener((value) => secondValues.push(value));
    try {
        const pending = second.functions.getAppleSafeArea();
        assert.equal(nativeCalls.length, 1);
        assert.deepEqual(await pending, insets);
        const latest = { ...insets, hingeAngle: 90, hingeStatus: HingeStatus.PartiallyOpen };
        emit(latest);
        assert.equal(nativeCalls.length, 1);
        assert.deepEqual(firstValues, [insets, latest]);
        assert.deepEqual(secondValues, [insets, latest]);
    } finally {
        await second.functions.removeAppleSafeAreaListener(id);
    }
});

test('routes direct invokeCall 300 requests through the existing native subscription', async () => {
    const values = [];
    await subscribe((value) => values.push(value));
    const rawValues = [];
    const pending = wrapper.functions.invokeCall({ action: 300 }, (value) => rawValues.push(value));
    assert.equal(nativeCalls.length, 1);
    emit(insets);
    assert.deepEqual(await pending, insets);
    const latest = { ...insets, right: 0, hingeStatus: HingeStatus.FullyOpen };
    emit(latest);
    assert.deepEqual(values, [insets, latest]);
    assert.deepEqual(rawValues, [insets, latest]);
});

test('uses a safe-area callback name independent of generic AppWrapper counters', async () => {
    const values = [];
    await subscribe((value) => values.push(value));
    const second = new AppWrapper();
    const otherCall = second.functions.invokeCall({ action: 999 });
    const callbackName = nativeCalls.at(-1).value.callback.replace(/^window\./, '');
    window[callbackName]({ retVal: 'unrelated' });
    assert.equal(await otherCall, 'unrelated');
    emit(insets);
    assert.deepEqual(values, [insets]);
});

test('shares compatibility subscriptions and cache across wrappers of the same host', async () => {
    let dispatch;
    let calls = 0;
    const host = {
        invokeCall: (options, callback) => {
            calls++;
            dispatch = callback;
            return Promise.resolve();
        },
    };
    const first = normalizeFunctions(host);
    // Different function objects can still expose the same host bridge.
    const second = normalizeFunctions({ ...host });
    const firstValues = [];
    const firstId = await first.addAppleSafeAreaListener((value) => firstValues.push(value));
    const pending = second.getAppleSafeArea();
    const secondValues = [];
    const secondId = await second.addAppleSafeAreaListener((value) => secondValues.push(value));
    assert.equal(calls, 1);
    dispatch(insets);
    assert.deepEqual(await pending, insets);
    await first.removeAppleSafeAreaListener(firstId);
    await second.removeAppleSafeAreaListener(secondId);
    const latest = { ...insets, right: 0, hingeStatus: HingeStatus.PartiallyOpen };
    dispatch(latest);
    const replay = [];
    const replayId = await first.addAppleSafeAreaListener((value) => replay.push(value));
    assert.equal(calls, 1);
    assert.deepEqual(replay, [latest]);
    assert.deepEqual(firstValues, [insets]);
    assert.deepEqual(secondValues, [insets]);
    await first.removeAppleSafeAreaListener(replayId);
});

test('does not mix compatibility subscriptions belonging to different hosts', async () => {
    const callbacks = [];
    const createHost = () => normalizeFunctions({ invokeCall: (options, callback) => { callbacks.push(callback); return Promise.resolve(); } });
    const first = createHost();
    const second = createHost();
    const firstValue = first.getAppleSafeArea();
    const secondValue = second.getAppleSafeArea();
    assert.equal(callbacks.length, 2);
    callbacks[0](insets);
    const other = { ...insets, left: 0 };
    callbacks[1](other);
    assert.deepEqual(await Promise.all([firstValue, secondValue]), [insets, other]);
});

test('a listener hook cleanup removes its own registration when used more than once', async () => {
    let addListener;
    const add = wrapper.functions.addAppleSafeAreaListener;
    wrapper.functions.addAppleSafeAreaListener = async (callback) => {
        const id = await add(callback);
        listenerIds.push(id);
        return id;
    };
    const ListenerProbe = () => { addListener = useSafeAreaListener(); return null; };
    root = createRoot(document.createElement('div'));
    await act(async () => root.render(createElement(ChaynsContext.Provider, { value: wrapper }, createElement(ListenerProbe))));
    const firstValues = [];
    const secondValues = [];
    const removeFirst = addListener((value) => firstValues.push(value));
    const removeSecond = addListener((value) => secondValues.push(value));
    await act(async () => removeFirst());
    emit(insets);
    assert.deepEqual(firstValues, []);
    assert.deepEqual(secondValues, [insets]);
    removeSecond();
});


test('adding a listener while the first getter is pending does not register call 300 again', async () => {
    const pending = wrapper.functions.getAppleSafeArea();
    const values = [];
    await subscribe((value) => values.push(value));
    assert.equal(nativeCalls.length, 1);
    emit(insets);
    assert.deepEqual(await pending, insets);
    emit({ ...insets, right: 0 });
    assert.equal(values.length, 2);
});

test('compatibility invokeCall 300 shares the listener and preserves unrelated raw calls', async () => {
    let dispatch;
    const actions = [];
    const functions = normalizeFunctions({
        invokeCall: (options, callback) => {
            actions.push(options.action);
            if (options.action === 300) dispatch = callback;
            return Promise.resolve('unrelated');
        },
    });
    const values = [];
    const id = await functions.addAppleSafeAreaListener((value) => values.push(value));
    const pending = functions.invokeCall({ action: 300 });
    const rawValues = [];
    const withCallback = functions.invokeCall({ action: 300 }, (value) => rawValues.push(value));
    dispatch(insets);
    assert.deepEqual(await pending, insets);
    assert.deepEqual(await withCallback, insets);
    dispatch({ ...insets, right: 0 });
    assert.deepEqual(rawValues, values);
    assert.equal(await functions.invokeCall({ action: 999 }), 'unrelated');
    assert.deepEqual(actions, [300, 999]);
    await functions.removeAppleSafeAreaListener(id);
});

test('a partial host with an existing listener never calls a competing getter', async () => {
    let dispatch;
    let calls = 0;
    const host = {
        addAppleSafeAreaListener: (callback) => { calls++; dispatch = callback; return Promise.resolve(17); },
        getAppleSafeArea: () => { throw new Error('competing getter must not be used'); },
    };
    const first = normalizeFunctions(host);
    const second = normalizeFunctions({ ...host });
    const pending = first.getAppleSafeArea();
    const values = [];
    const id = await second.addAppleSafeAreaListener((value) => values.push(value));
    dispatch(insets);
    assert.deepEqual(await pending, insets);
    await second.removeAppleSafeAreaListener(id);
    const latest = { ...insets, hingeStatus: HingeStatus.PartiallyOpen };
    dispatch(latest);
    assert.deepEqual(await first.getAppleSafeArea(), latest);
    assert.deepEqual(values, [insets]);
    assert.equal(calls, 1);
});

test('preserves complete host implementations and the unsupported-host zero fallback', async () => {
    const host = { addAppleSafeAreaListener() {}, removeAppleSafeAreaListener() {}, getAppleSafeArea() {}, isTrustedUrl() {} };
    assert.equal(normalizeFunctions(host), host);
    assert.deepEqual(await normalizeFunctions({}).getAppleSafeArea(), { top: 0, left: 0, bottom: 0, right: 0 });
});

test('getter-only compatibility hosts do not share cached state across server requests', async () => {
    let calls = 0;
    const getAppleSafeArea = () => Promise.resolve({ ...insets, top: ++calls });
    const first = normalizeFunctions({ getAppleSafeArea });
    const second = normalizeFunctions({ getAppleSafeArea });
    assert.equal((await first.getAppleSafeArea()).top, 1);
    assert.equal((await second.getAppleSafeArea()).top, 2);
    assert.equal((await first.getAppleSafeArea()).top, 1);
});

test('logs a failed native registration, rejects the getter and allows a later retry', async (t) => {
    const errors = t.mock.method(console, 'error', () => {});
    const postMessage = window.webkit.messageHandlers.jsonCall.postMessage;
    window.webkit.messageHandlers.jsonCall.postMessage = () => { throw new Error('native bridge unavailable'); };
    await assert.rejects(wrapper.functions.getAppleSafeArea(), /native bridge unavailable/);
    assert.equal(errors.mock.calls.length, 1);
    assert.match(errors.mock.calls[0].arguments[0], /Failed to initialize Apple safe-area updates/);
    window.webkit.messageHandlers.jsonCall.postMessage = postMessage;
    const pending = wrapper.functions.getAppleSafeArea();
    emit(insets);
    assert.deepEqual(await pending, insets);
    assert.equal(nativeCalls.length, 1);
});

test('retries an asynchronously rejected compatibility subscription without losing local listeners', async (t) => {
    const errors = t.mock.method(console, 'error', () => {});
    let attempts = 0;
    let dispatch;
    const functions = normalizeFunctions({
        invokeCall: (options, callback) => {
            attempts++;
            if (attempts === 1) return Promise.reject(new Error('host unavailable'));
            dispatch = callback;
            return Promise.resolve();
        },
    });
    const first = functions.getAppleSafeArea();
    await assert.rejects(first, /host unavailable/);
    const values = [];
    const id = await functions.addAppleSafeAreaListener((value) => values.push(value));
    const second = functions.getAppleSafeArea();
    dispatch(insets);
    assert.deepEqual(await second, insets);
    assert.deepEqual(values, [insets]);
    assert.equal(attempts, 2);
    assert.equal(errors.mock.calls.length, 1);
    await functions.removeAppleSafeAreaListener(id);
});


test('the hook cleans up the old host and listens to updated provider functions', async () => {
    const values = wrapper.values;
    const createHost = () => {
        let counter = 0;
        const callbacks = new Map();
        return {
            values,
            subscribe: () => () => {},
            callbacks,
            functions: {
                addAppleSafeAreaListener: (callback) => { const id = ++counter; callbacks.set(id, callback); return Promise.resolve(id); },
                removeAppleSafeAreaListener: (id) => { callbacks.delete(id); return Promise.resolve(); },
            },
        };
    };
    const oldHost = createHost();
    wrapper = oldHost;
    await renderHook();
    await act(async () => oldHost.callbacks.forEach((callback) => callback(insets)));
    assert.deepEqual(currentValue, insets);
    const newHost = createHost();
    wrapper = newHost;
    await renderHook();
    assert.equal(oldHost.callbacks.size, 0);
    assert.equal(newHost.callbacks.size, 1);
    const latest = { ...insets, right: 0, hingeStatus: HingeStatus.PartiallyOpen };
    await act(async () => newHost.callbacks.forEach((callback) => callback(latest)));
    assert.deepEqual(currentValue, latest);
    await renderHook(false);
    assert.equal(newHost.callbacks.size, 0);
});
