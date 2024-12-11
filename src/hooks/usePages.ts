import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsReactValues, Page } from '../types/IChaynsReact';
import { moduleWrapper } from '../components/moduleWrapper';
import { useInternalContextSelector } from "./context";
/**
 * @category Hooks
 */
export const usePages = ({ siteId } = { siteId: undefined }): ChaynsReactValues["pages"] => {
    const pages = useInternalContextSelector(ChaynsContext, v => v!.pages);
    if (siteId) {
        pages.filter(tapp => tapp.siteId === siteId);
    }
    return pages;
}
/**
 * @category Hooks
 */
export const usePage = ({ id, siteId }): Page | null => {
    const pages = useInternalContextSelector(ChaynsContext, v => v!.pages);
    if (id) {
        return pages.find(x => x.id === id && (!siteId || x.siteId === siteId)) ?? null;
    }
    return null;
}

export const getPage = ({ id, siteId } = { id: null, siteId: null }): Page | null => {
    const { pages, currentPage } = moduleWrapper.current.values;
    if(id) {
        return pages.find(x => x.id === id && (!siteId || x.siteId === siteId)) ?? null;
    }

    return pages.find(x => x.id === currentPage.id && (x.siteId === currentPage.siteId) || !x.siteId) ?? null;
}
