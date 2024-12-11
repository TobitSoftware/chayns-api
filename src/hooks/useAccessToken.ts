import { useEffect, useState } from "react";
import { AccessToken, AccessTokenResult } from "../types/IChaynsReact";
import { ChaynsFunctionsContext } from "../components/ChaynsContext";
import { useInternalContextSelector } from "./context";

/**
 * @category Hooks
 * @deprecated Use {@link getAccessToken} instead
 */
export const useAccessToken = (accessToken?: AccessToken): string | undefined => {
    const [token, setToken] = useState<AccessTokenResult | null>(null);
    const [externalToken, setExternalToken] = useState<AccessTokenResult | null>(null);

    const getAccessToken = useInternalContextSelector(ChaynsFunctionsContext, s => s.getAccessToken);

    useEffect(() => {
        if(accessToken?.external) {
            void getAccessToken({ external: true }).then(setExternalToken)
        } else {
            void getAccessToken().then(setToken)
        }
    }, [accessToken?.external, getAccessToken])

    return accessToken?.external ? externalToken?.accessToken : token?.accessToken;
}
