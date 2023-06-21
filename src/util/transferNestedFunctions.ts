// @ts-nocheck
import * as Comlink from 'comlink';

Comlink.transferHandlers.set("FUNCTION", {
    canHandle: obj => {
        return obj && typeof obj === "object" && Object.values(obj).some(x => typeof x === 'function');
    },
    serialize(obj) {
        obj._functionKeys = [];
        const ports = [];
        Object.entries(obj).forEach(([k,v]) => {
            if(typeof v === 'function'){
                const { port1, port2 } = new MessageChannel();
                obj._functionKeys.push(k);
                Comlink.expose(obj[k], port1);
                obj[k] = port2;
                ports.push(port2);
            }
        })
        return [obj,ports];
    },
    deserialize(obj) {
        obj._functionKeys.forEach((x) => {
            obj[x].start();
            obj[x] = Comlink.wrap(obj[x]);
        })
        return obj;
    }
});
