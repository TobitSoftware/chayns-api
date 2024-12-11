import { createContext } from 'react';
import { ChaynsReactFunctions, ChaynsReactValues } from '../types/IChaynsReact';

export const ChaynsContext = createContext<ChaynsReactValues | null>(null);
// @ts-expect-error Functions cant be null, implementation of default values is redundant
export const ChaynsFunctionsContext = createContext<ChaynsReactFunctions>(null);
