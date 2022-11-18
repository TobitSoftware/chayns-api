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

## Getting started

More information to setup chayns-api can be found in the [documentation](https://tobitsoftware.github.io/chayns-api/docs).


## License
