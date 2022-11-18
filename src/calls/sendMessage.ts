import type { IChaynsReact, IntercomMessage } from '../types/IChaynsReact';

const INTERCOM_URL = 'https://sub54.tobit.com/rest/api';
/**
 * @category Intercom functions
 */
export const sendMessageToUser = async (api: IChaynsReact, object: IntercomMessage, receiverUserId: number) => {
    if (!object.text) {
        return Promise.reject(new Error('no text specified'));
    }

    const senderUserId = api.values.user?.userId;
    if (senderUserId === undefined) {
        return Promise.reject(new Error('missing sender user id'));
    }
    const { accessToken } = await api.functions.getAccessToken();
    if (!accessToken) {
        return Promise.reject(new Error('send message requires a user to be logged in'));
    }
    if (!accessToken) {
        return Promise.reject(new Error('send message requires a user to be logged in'));
    }

    const images = Array.isArray(object.images) ? object.images.map(imageUrl => ({ url: imageUrl })) : []

    return sendMessage(`/user/${senderUserId}/message`, accessToken, {
        receivers: [{
            tobitId: receiverUserId
        }],
        message: {
            images,
            text: object.text,
            typeId: 1
        }
    });
}
/**
 * @category Intercom functions
 */
export const sendMessageToPage = async (api: IChaynsReact, object: IntercomMessage) => {
    if (!object.text) {
        return Promise.reject(new Error('no text specified'));
    }
    const senderUserId = api.values.user?.userId;

    if (senderUserId === undefined) {
        return Promise.reject(new Error('missing sender user id'));
    }
    const { accessToken } = await api.functions.getAccessToken();
    if (!accessToken) {
        return Promise.reject(new Error('send message requires a user to be logged in'));
    }

    const images = Array.isArray(object.images) ? object.images.map(imageUrl => ({ url: imageUrl })) : []

    return sendMessage(`/user/${senderUserId}/message`, accessToken, {
        receivers: [{
            locationId: api.values.site.locationId,
        }],
        message: {
            images,
            text: object.text,
            typeId: 1
        }
    });
}
/**
 * @category Intercom functions
 */
export const sendMessageToGroup = async (api: IChaynsReact, object: IntercomMessage, groupId: number) => {
    if (!object.text) {
        return Promise.reject(new Error('no text specified'));
    }
    const { accessToken } = await api.functions.getAccessToken();
    const { locationId } = api.values.site;
    if (!accessToken) {
        return Promise.reject(new Error('send message requires a user to be logged in'));
    }

    const images = Array.isArray(object.images) ? object.images.map(imageUrl => ({ url: imageUrl })) : []

    return sendMessage(`/location/${locationId}/broadcast`, accessToken, {
        receivers: [{
            groupId
        }],
        message: {
            images,
            text: object.text,
            typeId: 6
        }
    });
}
/**
 * @category Intercom functions
 */
function sendMessage(endpoint: string, token: string, body: unknown) {
    return fetch(`${INTERCOM_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            authorization: `bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });
}
