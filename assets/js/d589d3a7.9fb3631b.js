"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[162],{3905:(e,t,n)=>{n.d(t,{Zo:()=>p,kt:()=>m});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var c=r.createContext({}),l=function(e){var t=r.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},p=function(e){var t=l(e.components);return r.createElement(c.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,a=e.originalType,c=e.parentName,p=s(e,["components","mdxType","originalType","parentName"]),d=l(n),m=o,f=d["".concat(c,".").concat(m)]||d[m]||u[m]||a;return n?r.createElement(f,i(i({ref:t},p),{},{components:n})):r.createElement(f,i({ref:t},p))}));function m(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=n.length,i=new Array(a);i[0]=d;var s={};for(var c in t)hasOwnProperty.call(t,c)&&(s[c]=t[c]);s.originalType=e,s.mdxType="string"==typeof e?e:o,i[1]=s;for(var l=2;l<a;l++)i[l]=n[l];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},9390:(e,t,n)=>{n.r(t),n.d(t,{contentTitle:()=>i,default:()=>p,frontMatter:()=>a,metadata:()=>s,toc:()=>c});var r=n(7462),o=(n(7294),n(3905));const a={title:"Getting Started",slug:"/"},i=void 0,s={unversionedId:"getting-started",id:"getting-started",title:"Getting Started",description:"To start a new project with chayns-api, use our",source:"@site/docs/getting-started.md",sourceDirName:".",slug:"/",permalink:"/docs/",editUrl:"https://github.com/TobitSoftware/chayns-api/edit/main/docs/docs/getting-started.md",tags:[],version:"current",frontMatter:{title:"Getting Started",slug:"/"},sidebar:"docs",next:{title:"Contributing",permalink:"/docs/contributing"}},c=[{value:"Setup",id:"setup",children:[],level:2},{value:"Example Hook",id:"example-hook",children:[],level:2},{value:"Example without hook",id:"example-without-hook",children:[],level:2},{value:"Usage of event listeners",id:"usage-of-event-listeners",children:[],level:2}],l={toc:c};function p(e){let{components:t,...n}=e;return(0,o.kt)("wrapper",(0,r.Z)({},l,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"To start a new project with ",(0,o.kt)("inlineCode",{parentName:"p"},"chayns-api"),", use our\n",(0,o.kt)("a",{parentName:"p",href:"https://github.com/TobitSoftware/create-chayns-app"},(0,o.kt)("inlineCode",{parentName:"a"},"create-chayns-app")),"\ncommand line tool. It will set up an optimal development environment for you in\none command."),(0,o.kt)("p",null,"To use the api, it is required to have your App wrapped by the ChaynsProvider. The chayns-toolkit has to be installed and updated to version 2.0.0-beta.19. "),(0,o.kt)("h2",{id:"setup"},"Setup"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-jsx"},"import { ChaynsProvider } from 'chayns-api';\n\nconst AppWrapper = () => (\n    <ChaynsProvider>\n        <App/>\n    </ChaynsProvider>\n)\n")),(0,o.kt)("h2",{id:"example-hook"},"Example Hook"),(0,o.kt)("p",null,"The user object is null when no user is logged in.\nAfter a login the user object changes and triggers a rerender. "),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-jsx"},"import { useUser } from 'chayns-api';\n\nconst FirstName = () => {\n  const user = useUser();\n  \n  return (\n      <div>{user?.firstName}</div>\n  );\n}\n")),(0,o.kt)("h2",{id:"example-without-hook"},"Example without hook"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-jsx"},"import { getUser, getAccessToken } from 'chayns-api';\n\nconst getBookings = async () => {\n    const { accessToken } = await getAccessToken();\n    const { personId } = getUser();\n    const requestData = {\n        headers: {\n            Authorization: `Bearer ${accessToken}`\n        } \n    }\n    return fetch(`https://example.com/bookings/${personId}`, requestData);\n}\n")),(0,o.kt)("h2",{id:"usage-of-event-listeners"},"Usage of event listeners"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-jsx"},'import { addWindowMetricsListener, removeWindowMetricsListener } from \'chayns-api\';\nimport { useEffect } from "react";\n\nconst FloatingButton = async () => {\n    const promiseRef = useRef();\n    \n    useEffect(() => {\n        promiseRef.current = addWindowMetricsListener(value, (data) => {\n            console.log("Data", data)\n        });\n\n        return () => promiseRef.current?.then(removeWindowMetricsListener);\n    }, [])\n    return <div>Float</div>\n}\n')))}p.isMDXComponent=!0}}]);