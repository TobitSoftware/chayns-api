import { useContextSelector } from 'use-context-selector';
import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsReactValues, Page } from '../types/IChaynsReact';
/**
 * @category Hooks
 */
export const usePages = ({ siteId } = { siteId: undefined }): ChaynsReactValues["pages"] => {
    const pages = useContextSelector(ChaynsContext, v => v!.pages);
    if (siteId) {
        pages.filter(tapp => tapp.siteId === siteId);
    }
    return pages;
}
/**
 * @category Hooks
 */
export const usePage = ({ id, siteId }): Page | null => {
    const pages = useContextSelector(ChaynsContext, v => v!.pages);
    if (id) {
        return pages.find(x => x.id === id && (!siteId || x.siteId === siteId)) ?? null;
    }
    return null;
}
