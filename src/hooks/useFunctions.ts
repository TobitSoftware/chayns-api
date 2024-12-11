import { ChaynsFunctionsContext } from "../components/ChaynsContext";
import { ChaynsReactFunctions } from "../types/IChaynsReact";
import { useInternalContextSelector } from "./context";

/**
 * @category Hooks
 */
export const useFunctions = () => {
    return useInternalContextSelector(ChaynsFunctionsContext, f => f || {} as ChaynsReactFunctions);
}
