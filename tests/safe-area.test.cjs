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
const { useSafeArea } = require('../dist/cjs/hooks/useSafeArea');
const { AppName, HingeStatus } = require('../dist/cjs/types/IChaynsReact');
const { AppWrapper } = require('../dist/cjs/wrapper/AppWrapper');
const { normalizeFunctions } = require('../dist/cjs/wrapper/normalizeFunctions');

const insets = { top: 12, left: 17, bottom: 20, right: 43 };
let wrapper;
let nativeCalls;
let listenerIds;
let root;
let currentValue;

const emit = (value) => {
    const call = nativeCalls.findLast(({ action }) => action === 300);
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
});

test('exports the three native hinge status values through the public entry point', () => {
    assert.deepEqual(HingeStatus, { Closed: 'closed', PartiallyOpen: 'partiallyOpen', FullyOpen: 'fullyOpen' });
    assert.equal(require('../dist/cjs').HingeStatus, HingeStatus);
});

for (const hingeStatus of Object.values(HingeStatus)) {
    test(`preserves ${hingeStatus} and a zero angle in a direct safe-area request`, async () => {
        const expected = { ...insets, hingeAngle: 0, hingeStatus, additionalNativeValue: 42 };
        const pending = wrapper.functions.getAppleSafeArea();
        assert.equal(nativeCalls[0].action, 300);
        emit(expected);
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

test('shares one native callback between compatibility wrappers and keeps remaining listeners active', async () => {
    let dispatch;
    let calls = 0;
    const host = {
        invokeCall: (options, callback) => {
            assert.equal(options.action, 300);
            calls += 1;
            dispatch = callback;
            return Promise.resolve();
        },
    };
    const first = normalizeFunctions(host);
    const second = normalizeFunctions(host);
    const firstValues = [];
    const secondValues = [];
    const firstId = await first.addAppleSafeAreaListener((value) => firstValues.push(value));
    const secondId = await second.addAppleSafeAreaListener((value) => secondValues.push(value));
    try {
        assert.equal(calls, 1);
        const expected = { ...insets, hingeAngle: 90, hingeStatus: HingeStatus.PartiallyOpen };
        dispatch(expected);
        assert.deepEqual(firstValues, [expected]);
        assert.deepEqual(secondValues, [expected]);
        assert.deepEqual(await first.getAppleSafeArea(), expected);
        assert.deepEqual(await second.getAppleSafeArea(), expected);
        await first.removeAppleSafeAreaListener(firstId);
        const opened = { ...expected, hingeAngle: 180, hingeStatus: HingeStatus.FullyOpen };
        dispatch(opened);
        assert.deepEqual(firstValues, [expected]);
        assert.deepEqual(secondValues, [expected, opened]);
    } finally {
        await first.removeAppleSafeAreaListener(firstId);
        await second.removeAppleSafeAreaListener(secondId);
    }
});

test('shares the active native callback with concurrent getters and preserves subsequent hinge updates', async () => {
    const values = [];
    await subscribe((value) => values.push(value));
    const first = wrapper.functions.getAppleSafeArea();
    const second = wrapper.functions.getAppleSafeArea();
    assert.equal(nativeCalls.length, 1);
    const closed = { ...insets, hingeAngle: 0, hingeStatus: HingeStatus.Closed };
    emit(closed); // Only the most recently registered native callback is called.
    assert.deepEqual(await Promise.all([first, second]), [closed, closed]);
    const opened = { ...insets, hingeAngle: 180, hingeStatus: HingeStatus.FullyOpen };
    emit(opened);
    assert.deepEqual(values, [closed, opened]);
    assert.deepEqual(await wrapper.functions.getAppleSafeArea(), opened);
    assert.equal(nativeCalls.length, 1);
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
