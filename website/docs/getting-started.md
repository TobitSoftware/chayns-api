---
title: Getting Started
slug: /
---

To start a new project with `chayns-api`, use our
[`create-chayns-app`](https://github.com/TobitSoftware/create-chayns-app)
command line tool. It will set up an optimal development environment for you in
one command.

To use the api, it is required to have your App wrapped by the ChaynsProvider. The chayns-toolkit has to be installed and updated to version 2.0.0-beta.19. 

## Setup
```jsx
import { ChaynsProvider } from 'chayns-api';

const AppWrapper = () => (
    <ChaynsProvider>
        <App/>
    </ChaynsProvider>
)
```

When adding the page to your chayns site activate the v5 checkbox.

![add page](https://chayns.space/75508-15270/code/add_page.png?1)


## Example Hook

The user object is null when no user is logged in. 
After a login the user object changes and triggers a rerender. 
```jsx
import { useUser } from 'chayns-api';

const FirstName = () => {
  const user = useUser();
  
  return (
      <div>{user?.firstName}</div>
  );
}
```

## Example without hook
```jsx
import { getUser, getAccessToken } from 'chayns-api';

const getBookings = async () => {
    const { accessToken } = await getAccessToken();
    const { personId } = getUser();
    const requestData = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        } 
    }
    return fetch(`https://example.com/bookings/${personId}`, requestData);
}
```

## Usage of event listeners

```jsx
import { addWindowMetricsListener, removeWindowMetricsListener } from 'chayns-api';
import { useEffect } from "react";

const FloatingButton = async () => {
    const promiseRef = useRef();
    
    useEffect(() => {
        promiseRef.current = addWindowMetricsListener(value, (data) => {
            console.log("Data", data)
        });

        return () => promiseRef.current?.then(removeWindowMetricsListener);
    }, [])
    return <div>Float</div>
}
```
