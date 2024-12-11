import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsApiUser, ChaynsReactValues } from '../types/IChaynsReact';
import { useInternalContextSelector } from "./context";

const empty = {}
/**
 * @category Hooks
 */
export const useUser = () => useInternalContextSelector<ChaynsReactValues | null, ChaynsApiUser>(ChaynsContext, (value) => value?.user || empty);
