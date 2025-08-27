export const DefaultLoginDialogOptions = {
    type: "module",
    system: {
        scope: "chayns_login",
        // url: "https://w-mgertdenken-l.tobit.ag:8081/v2.remoteEntry.js",
        url: `https://login.chayns.net/v4/v2.remoteEntry.js`,
        module: './Login',
    },
    minHeight: 200,
    seamless: true,
    dialogInput: { },
    buttons: [],
    hideDragHandle: true
}
