import { ChaynsStyleSettings } from '../types/IChaynsReact';
import { useValuesSelector } from './context';

export const useStyleSettings = (): ChaynsStyleSettings | undefined => useValuesSelector((state) => state.styleSettings);
