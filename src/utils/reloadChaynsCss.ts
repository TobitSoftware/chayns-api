let requestId = 0;
let pendingLink: HTMLLinkElement | null = null;

export const reloadChaynsCss = (systemFontSize: number) => {
    if (pendingLink?.isConnected) {
        const pendingUrl = new URL(pendingLink.href);
        const pendingParam = [...pendingUrl.searchParams.keys()].find(
            key => key.toLowerCase() === 'systemfontsize'
        );

        if (pendingParam !== undefined && pendingUrl.searchParams.get(pendingParam) === String(systemFontSize)) {
            return;
        }
    }

    const currentRequestId = ++requestId;
    pendingLink?.remove();
    pendingLink = null;

    const currentLink = document.querySelector<HTMLLinkElement>(
        'link[rel="stylesheet"][href*="style-staging.tobit.cloud/css/"], ' +
        'link[rel="stylesheet"][href*="style.tobit.cloud/css/"]'
    );

    if (!currentLink) {
        console.warn('Stylesheet nicht gefunden.');
        return;
    }

    const url = new URL(currentLink.href);

    const existingParam = [...url.searchParams.keys()].find(
        key => key.toLowerCase() === 'systemfontsize'
    );

    if (
        existingParam !== undefined &&
        url.searchParams.get(existingParam) === String(systemFontSize)
    ) {
        return;
    }

    [...url.searchParams.keys()].forEach(key => {
        if (key.toLowerCase() === 'systemfontsize') {
            url.searchParams.delete(key);
        }
    });

    url.searchParams.set('systemFontSize', String(systemFontSize));

    const newLink = document.createElement('link');
    newLink.rel = 'stylesheet';
    newLink.type = 'text/css';
    newLink.href = url.toString();
    newLink.onload = () => {
        if (currentRequestId !== requestId) {
            newLink.remove();
            return;
        }

        currentLink.remove();
        pendingLink = null;
    };

    newLink.onerror = () => {
        newLink.remove();
        if (pendingLink === newLink) {
            pendingLink = null;
        }
        if (currentRequestId === requestId) {
            console.error('[chayns-api] Error loading chayns-css with systemFontSize:', systemFontSize);
        }
    };

    pendingLink = newLink;
    currentLink.after(newLink);
}
