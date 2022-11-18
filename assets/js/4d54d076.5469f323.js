"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[80],{3905:(e,t,n)=>{n.d(t,{Zo:()=>s,kt:()=>b});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function c(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var l=r.createContext({}),p=function(e){var t=r.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},s=function(e){var t=p(e.components);return r.createElement(l.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},m=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,i=e.originalType,l=e.parentName,s=c(e,["components","mdxType","originalType","parentName"]),m=p(n),b=o,f=m["".concat(l,".").concat(b)]||m[b]||u[b]||i;return n?r.createElement(f,a(a({ref:t},s),{},{components:n})):r.createElement(f,a({ref:t},s))}));function b(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var i=n.length,a=new Array(i);a[0]=m;var c={};for(var l in t)hasOwnProperty.call(t,l)&&(c[l]=t[l]);c.originalType=e,c.mdxType="string"==typeof e?e:o,a[1]=c;for(var p=2;p<i;p++)a[p]=n[p];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}m.displayName="MDXCreateElement"},1933:(e,t,n)=>{n.r(t),n.d(t,{contentTitle:()=>a,default:()=>s,frontMatter:()=>i,metadata:()=>c,toc:()=>l});var r=n(7462),o=(n(7294),n(3905));const i={title:"Contributing",slug:"contributing"},a=void 0,c={unversionedId:"contributing",id:"contributing",title:"Contributing",description:"First you should",source:"@site/docs/contributing.md",sourceDirName:".",slug:"/contributing",permalink:"/chayns-api/docs/contributing",editUrl:"https://github.com/TobitSoftware/chayns-api/edit/main/docs/docs/contributing.md",tags:[],version:"current",frontMatter:{title:"Contributing",slug:"contributing"},sidebar:"docs",previous:{title:"Getting Started",permalink:"/chayns-api/docs/"}},l=[{value:"Releasing a new version",id:"releasing-a-new-version",children:[],level:2}],p={toc:l};function s(e){let{components:t,...n}=e;return(0,o.kt)("wrapper",(0,r.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"First you should\n",(0,o.kt)("a",{parentName:"p",href:"https://github.com/tobitsoftware/chayns-api/fork"},"fork the project")," to your\nown GitHub-Account to be able to commit changes to it."),(0,o.kt)("p",null,"Then clone the forked version to your computer. Install the packages by\nexecuting"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"npm i\n")),(0,o.kt)("p",null,"Link the package into the ",(0,o.kt)("a",{parentName:"p",href:"https://github.com/tobitsoftware/chayns-api-example"},"example project")," by running"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"# in chayns-api directory\nnpm watch \n\n# in chayns-api-example\nnpm i\nnpm link chayns-api\n")),(0,o.kt)("h2",{id:"releasing-a-new-version"},"Releasing a new version"),(0,o.kt)("p",null,"If you have enough permissions on GitHub and NPM you can release a new version."),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"Use ",(0,o.kt)("inlineCode",{parentName:"li"},"npm version (patch|minor|major)")," to increase the version."),(0,o.kt)("li",{parentName:"ol"},"Use ",(0,o.kt)("inlineCode",{parentName:"li"},"npm publish")," to release the new version.")),(0,o.kt)("p",null,"You do not have to build the project beforehand, that will be done pre-publish."))}s.isMDXComponent=!0}}]);