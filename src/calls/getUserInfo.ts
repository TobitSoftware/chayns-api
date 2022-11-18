import type { IChaynsReact, UserInfoQuery } from '../types/IChaynsReact';

type RelationsUserResponse = {
    personId: string,
    firstName: string,
    lastName: string,
    userId: number;
    name: string
}

const getUserInfo = async (api: IChaynsReact, value: UserInfoQuery) => {
    const query = value.personId ?? value.userId;

    if (!query) {
        throw new Error('Invalid Parameters - You have to provide at least one of these Parameters: userId, personId');
    }

    const { accessToken } = await api.functions.getAccessToken();

    if (!accessToken) {
        throw new Error('get user info requires a user to be logged in');
    }

    const res = await fetch(`https://relations.chayns.net/relations/user/findUser?searchString=${query}`, {
        'headers': {
            'authorization': `bearer ${accessToken}`
        }
    });

    if (res.ok) {
        const data = await res.json() as RelationsUserResponse[];
        if (data.length === 0) {
            return null;
        }

        return {
            firstName: data[0].firstName,
            lastName: data[0].lastName,
            userId: data[0].userId,
            personId: data[0].personId,
            name: data[0].name,
        };
    }

    throw new Error(`getUserInfo failed with status ${res.status}`);
}

export default getUserInfo;
