import { useContextSelector } from "use-context-selector";
import {  ChaynsFunctionsContext } from "../components/ChaynsContext";
import { ChaynsReactFunctions } from "../types/IChaynsReact";
/**
 * @category Hooks
 */
export const useFunctions = () => {
    const t = useContextSelector(ChaynsFunctionsContext, f => f || {} as ChaynsReactFunctions)
    return t;
}
