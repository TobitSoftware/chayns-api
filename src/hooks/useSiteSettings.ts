import { ChaynsSiteSettings } from '../types/IChaynsReact';
import { useValuesSelector } from './context';

export const useSiteSettings = (): ChaynsSiteSettings | undefined => useValuesSelector((state) => state.siteSettings);
