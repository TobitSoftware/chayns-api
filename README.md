# [chayns react api](https://github.com/TobitSoftware/chayns-api) &middot; [![license](https://img.shields.io/github/license/TobitSoftware/chayns-api.svg)]() [![GitHub pull requests](https://img.shields.io/github/issues-pr/TobitSoftware/chayns-api.svg)]() [![](https://img.shields.io/github/issues-pr-closed-raw/TobitSoftware/chayns-api.svg)]()

The chayns-api provides information and useful functions to your page. The information and functions are provided by react hooks and normal functions.
A list of all functions and hooks can be found [here](https://tobitsoftware.github.io/chayns-api/docs).

## Installation

It is recommended to setup your new chayns page with the [create-chayns-app](https://github.com/TobitSoftware/create-chayns-app).


### Migrate old project
1. Install chayns-api package
```sh
# NPM
$ npm install chayns-api

# Yarn
$ yarn add chayns-api
```

2. Wrap your App component with the "ChaynsProvider" component. In all components which are under the ChaynsProvider you can use hooks and chayns functions. 
```jsx
<ChaynsProvider>
   <App/>
</ChaynsProvider>
```

## Example

```jsx
import { useUser } from 'chayns-api';

const FirstName = () => {
    const user = useUser();

    return (
        <div>{user?.firstName}</div>
    );
}
```

## Migrate v1 to v2

When updating to chayns-api@2 you should also update chayns-toolkit to 3.0.1 or higher (check migration guide [here](https://github.com/TobitSoftware/chayns-toolkit/tree/main?tab=readme-ov-file#-migration-v2-to-v3)).

Check urls referencing **remoteEntry.js**. The filename has been changed to **v2.remoteEntry.js**.

When your application uses ChaynsHost with module-type you might have to add a call of **initModuleFederationSharing** as early as possible in your application (e.g. index/bootstrap). Unless your application is already embedded as module somewhere else (e.g. in a dialog).

```
initModuleFederationSharing({ name: 'project_name' });
```


## Getting started

More information to setup chayns-api can be found in the [documentation](https://tobitsoftware.github.io/chayns-api/docs).

## Troubleshooting

```
Can't resolve 'react-dom/client'
```
A warning like above can be shown when you are still using react 17.
This can be ignored because the react 17 api is used as fallback instead.

## License
