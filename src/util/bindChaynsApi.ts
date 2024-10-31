import {StaticChaynsApi} from "../index";

export const bindChaynsApi = (fun) =>
    (values, functions) => {
        new StaticChaynsApi(values, functions);
        return fun;
    }
