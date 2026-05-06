export default async function postIframeForm(url: string, value: string, fieldName: string, frameId: string) {
    // ToDo: Maybe remove this
    await new Promise(resolve => { setTimeout(resolve, 10) });

    if (!value || !document.querySelector(`#${frameId}`)) {
        return false;
    }

    const currForm = document.getElementById('accessTokenForm');

    if (currForm?.parentElement) {
        currForm.parentElement.removeChild(currForm);
    }

    const form = document.createElement('form');

    form.setAttribute('id', 'accessTokenForm');
    form.setAttribute('method', 'post');
    form.setAttribute('action', url);
    form.setAttribute('target', frameId);

    const hiddenField = document.createElement('input');
    hiddenField.setAttribute('type', 'hidden');
    hiddenField.setAttribute('name', fieldName);
    hiddenField.setAttribute('value', value);

    form.appendChild(hiddenField);
    document.body.appendChild(form);
    form.submit();
    return true;
}
