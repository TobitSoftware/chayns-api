import { IChaynsReact } from '../types/IChaynsReact';

const moduleWrapperStack: IChaynsReact[] = [];
let current: IChaynsReact = undefined!;

export const moduleWrapper: { current: IChaynsReact } = {
    get current(): IChaynsReact {
        if (moduleWrapperStack.length === 0 && !current) {
            throw new Error("No chayns api instance initialized");
        }
        return moduleWrapperStack.length > 0 ? moduleWrapperStack[moduleWrapperStack.length - 1] : current;
    },
    set current(chayns: IChaynsReact) {
        current = chayns;
    }
 }

export const addModuleWrapper = (chayns: IChaynsReact) => {
    moduleWrapperStack.push(chayns);
}

 export const removeModuleWrapper = (chayns: IChaynsReact) => {
    const index = moduleWrapperStack.indexOf(chayns);
    if (index > -1) {
        moduleWrapperStack.splice(index, 1);
    }
 }
