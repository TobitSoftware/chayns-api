import {Context, useContext} from "react";

export const useInternalContextSelector = <ContextValue, Result>(context: Context<ContextValue>, selector: (value: ContextValue) => Result) => {
    const value = useContext(context);

    return selector(value);
}