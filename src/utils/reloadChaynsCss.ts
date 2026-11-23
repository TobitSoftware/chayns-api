export const reloadChaynsCss = (systemFontSize: number) => {
    const currentLink = document.querySelector(
        'link[rel="stylesheet"][href*="style-staging.tobit.cloud/css/"], ' +
        'link[rel="stylesheet"][href*="style.tobit.cloud/css/"]'
    ) as HTMLLinkElement | null;

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
        currentLink.remove();
    };

    newLink.onerror = () => {
        newLink.remove();
        console.error('[chayns-api] Error loading chayns-css with systemFontSize:', systemFontSize);
    };

    currentLink.after(newLink);
}
