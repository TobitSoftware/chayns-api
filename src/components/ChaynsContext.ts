import { createContext } from 'react';
import { IChaynsReact } from '../types/IChaynsReact';

export const ChaynsContext = createContext<IChaynsReact | null>(null);
