import StaticChaynsApi from '../wrapper/StaticChaynsApi';

export const bindChaynsApi = (fun) =>
    (values, functions) => {
        new StaticChaynsApi(values, functions);
        return fun;
    };
