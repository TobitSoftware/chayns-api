"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[707],{9649:(e,t,n)=>{n.r(t),n.d(t,{MainHeading:()=>p,default:()=>u});var o=n(7462),r=n(7294),l=n(6010),a=n(5999),s=n(3810);const c="anchorWithStickyNavbar_y2LR",i="anchorWithHideOnScrollNavbar_3ly5",p=e=>{let{...t}=e;return r.createElement("header",null,r.createElement("h1",(0,o.Z)({},t,{id:void 0}),t.children))},u=e=>{return"h1"===e?p:(t=e,e=>{let{id:n,...p}=e;const{navbar:{hideOnScroll:u}}=(0,s.useThemeConfig)();return n?r.createElement(t,(0,o.Z)({},p,{className:(0,l.Z)("anchor",{[i]:u,[c]:!u}),id:n}),p.children,r.createElement("a",{className:"hash-link",href:`#${n}`,title:(0,a.I)({id:"theme.common.headingLinkTitle",message:"Direct link to heading",description:"Title for link to heading"})},"\u200b")):r.createElement(t,p)});var t}},7707:(e,t,n)=>{n.r(t),n.d(t,{default:()=>x});var o=n(7462),r=n(7294),l=n(2859),a=n(9960),s=n(6010);const c={plain:{backgroundColor:"#2a2734",color:"#9a86fd"},styles:[{types:["comment","prolog","doctype","cdata","punctuation"],style:{color:"#6c6783"}},{types:["namespace"],style:{opacity:.7}},{types:["tag","operator","number"],style:{color:"#e09142"}},{types:["property","function"],style:{color:"#9a86fd"}},{types:["tag-id","selector","atrule-id"],style:{color:"#eeebff"}},{types:["attr-name"],style:{color:"#c4b9fe"}},{types:["boolean","string","entity","url","attr-value","keyword","control","directive","unit","statement","regex","atrule","placeholder","variable"],style:{color:"#ffcc99"}},{types:["deleted"],style:{textDecorationLine:"line-through"}},{types:["inserted"],style:{textDecorationLine:"underline"}},{types:["italic"],style:{fontStyle:"italic"}},{types:["important","bold"],style:{fontWeight:"bold"}},{types:["important"],style:{color:"#c4b9fe"}}]};var i={Prism:n(7410).default,theme:c};function p(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function u(){return u=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(e[o]=n[o])}return e},u.apply(this,arguments)}var d=/\r\n|\r|\n/,y=function(e){0===e.length?e.push({types:["plain"],content:"\n",empty:!0}):1===e.length&&""===e[0].content&&(e[0].content="\n",e[0].empty=!0)},m=function(e,t){var n=e.length;return n>0&&e[n-1]===t?e:e.concat(t)},h=function(e,t){var n=e.plain,o=Object.create(null),r=e.styles.reduce((function(e,n){var o=n.languages,r=n.style;return o&&!o.includes(t)||n.types.forEach((function(t){var n=u({},e[t],r);e[t]=n})),e}),o);return r.root=n,r.plain=u({},n,{backgroundColor:null}),r};function g(e,t){var n={};for(var o in e)Object.prototype.hasOwnProperty.call(e,o)&&-1===t.indexOf(o)&&(n[o]=e[o]);return n}const f=function(e){function t(){for(var t=this,n=[],o=arguments.length;o--;)n[o]=arguments[o];e.apply(this,n),p(this,"getThemeDict",(function(e){if(void 0!==t.themeDict&&e.theme===t.prevTheme&&e.language===t.prevLanguage)return t.themeDict;t.prevTheme=e.theme,t.prevLanguage=e.language;var n=e.theme?h(e.theme,e.language):void 0;return t.themeDict=n})),p(this,"getLineProps",(function(e){var n=e.key,o=e.className,r=e.style,l=u({},g(e,["key","className","style","line"]),{className:"token-line",style:void 0,key:void 0}),a=t.getThemeDict(t.props);return void 0!==a&&(l.style=a.plain),void 0!==r&&(l.style=void 0!==l.style?u({},l.style,r):r),void 0!==n&&(l.key=n),o&&(l.className+=" "+o),l})),p(this,"getStyleForToken",(function(e){var n=e.types,o=e.empty,r=n.length,l=t.getThemeDict(t.props);if(void 0!==l){if(1===r&&"plain"===n[0])return o?{display:"inline-block"}:void 0;if(1===r&&!o)return l[n[0]];var a=o?{display:"inline-block"}:{},s=n.map((function(e){return l[e]}));return Object.assign.apply(Object,[a].concat(s))}})),p(this,"getTokenProps",(function(e){var n=e.key,o=e.className,r=e.style,l=e.token,a=u({},g(e,["key","className","style","token"]),{className:"token "+l.types.join(" "),children:l.content,style:t.getStyleForToken(l),key:void 0});return void 0!==r&&(a.style=void 0!==a.style?u({},a.style,r):r),void 0!==n&&(a.key=n),o&&(a.className+=" "+o),a})),p(this,"tokenize",(function(e,t,n,o){var r={code:t,grammar:n,language:o,tokens:[]};e.hooks.run("before-tokenize",r);var l=r.tokens=e.tokenize(r.code,r.grammar,r.language);return e.hooks.run("after-tokenize",r),l}))}return e&&(t.__proto__=e),t.prototype=Object.create(e&&e.prototype),t.prototype.constructor=t,t.prototype.render=function(){var e=this.props,t=e.Prism,n=e.language,o=e.code,r=e.children,l=this.getThemeDict(this.props),a=t.languages[n];return r({tokens:function(e){for(var t=[[]],n=[e],o=[0],r=[e.length],l=0,a=0,s=[],c=[s];a>-1;){for(;(l=o[a]++)<r[a];){var i=void 0,p=t[a],u=n[a][l];if("string"==typeof u?(p=a>0?p:["plain"],i=u):(p=m(p,u.type),u.alias&&(p=m(p,u.alias)),i=u.content),"string"==typeof i){var h=i.split(d),g=h.length;s.push({types:p,content:h[0]});for(var f=1;f<g;f++)y(s),c.push(s=[]),s.push({types:p,content:h[f]})}else a++,t.push(p),n.push(i),o.push(0),r.push(i.length)}a--,t.pop(),n.pop(),o.pop(),r.pop()}return y(s),c}(void 0!==a?this.tokenize(t,o,a,n):[o]),className:"prism-code language-"+n,style:void 0!==l?l.root:{},getLineProps:this.getLineProps,getTokenProps:this.getTokenProps})},t}(r.Component);var v=n(5999),b=n(3810);const k={plain:{color:"#bfc7d5",backgroundColor:"#292d3e"},styles:[{types:["comment"],style:{color:"rgb(105, 112, 152)",fontStyle:"italic"}},{types:["string","inserted"],style:{color:"rgb(195, 232, 141)"}},{types:["number"],style:{color:"rgb(247, 140, 108)"}},{types:["builtin","char","constant","function"],style:{color:"rgb(130, 170, 255)"}},{types:["punctuation","selector"],style:{color:"rgb(199, 146, 234)"}},{types:["variable"],style:{color:"rgb(191, 199, 213)"}},{types:["class-name","attr-name"],style:{color:"rgb(255, 203, 107)"}},{types:["tag","deleted"],style:{color:"rgb(255, 85, 114)"}},{types:["operator"],style:{color:"rgb(137, 221, 255)"}},{types:["boolean"],style:{color:"rgb(255, 88, 116)"}},{types:["keyword"],style:{fontStyle:"italic"}},{types:["doctype"],style:{color:"rgb(199, 146, 234)",fontStyle:"italic"}},{types:["namespace"],style:{color:"rgb(178, 204, 214)"}},{types:["url"],style:{color:"rgb(221, 221, 221)"}}]};var E=n(5350);const T=()=>{const{prism:e}=(0,b.useThemeConfig)(),{isDarkTheme:t}=(0,E.Z)(),n=e.theme||k,o=e.darkTheme||n;return t?o:n},N="codeBlockContainer_J+bg",C="codeBlockContent_csEI",Z="codeBlockTitle_oQzk",S="codeBlock_rtdJ",L="copyButton_M3SB",B="codeBlockLines_1zSZ";function O(e){let{children:t,className:n,metastring:l,title:a}=e;const{prism:c}=(0,b.useThemeConfig)(),[p,u]=(0,r.useState)(!1),[d,y]=(0,r.useState)(!1);(0,r.useEffect)((()=>{y(!0)}),[]);const m=(0,b.parseCodeBlockTitle)(l)||a,h=T(),g=Array.isArray(t)?t.join(""):t,k=(0,b.parseLanguage)(n)??c.defaultLanguage,{highlightLines:E,code:O}=(0,b.parseLines)(g,l,k),P=()=>{!function(e,t){let{target:n=document.body}=void 0===t?{}:t;const o=document.createElement("textarea"),r=document.activeElement;o.value=e,o.setAttribute("readonly",""),o.style.contain="strict",o.style.position="absolute",o.style.left="-9999px",o.style.fontSize="12pt";const l=document.getSelection();let a=!1;l.rangeCount>0&&(a=l.getRangeAt(0)),n.append(o),o.select(),o.selectionStart=0,o.selectionEnd=e.length;let s=!1;try{s=document.execCommand("copy")}catch{}o.remove(),a&&(l.removeAllRanges(),l.addRange(a)),r&&r.focus()}(O),u(!0),setTimeout((()=>u(!1)),2e3)};return r.createElement(f,(0,o.Z)({},i,{key:String(d),theme:h,code:O,language:k}),(e=>{let{className:t,style:l,tokens:a,getLineProps:c,getTokenProps:i}=e;return r.createElement("div",{className:(0,s.Z)(N,n,b.ThemeClassNames.common.codeBlock)},m&&r.createElement("div",{style:l,className:Z},m),r.createElement("div",{className:(0,s.Z)(C,k)},r.createElement("pre",{tabIndex:0,className:(0,s.Z)(t,S,"thin-scrollbar"),style:l},r.createElement("code",{className:B},a.map(((e,t)=>{1===e.length&&"\n"===e[0].content&&(e[0].content="");const n=c({line:e,key:t});return E.includes(t)&&(n.className+=" docusaurus-highlight-code-line"),r.createElement("span",(0,o.Z)({key:t},n),e.map(((e,t)=>r.createElement("span",(0,o.Z)({key:t},i({token:e,key:t}))))),r.createElement("br",null))})))),r.createElement("button",{type:"button","aria-label":(0,v.I)({id:"theme.CodeBlock.copyButtonAriaLabel",message:"Copy code to clipboard",description:"The ARIA label for copy code blocks button"}),className:(0,s.Z)(L,"clean-btn"),onClick:P},p?r.createElement(v.Z,{id:"theme.CodeBlock.copied",description:"The copied button label on code blocks"},"Copied"):r.createElement(v.Z,{id:"theme.CodeBlock.copy",description:"The copy button label on code blocks"},"Copy"))))}))}var P=n(9649);const _="details_h+cY";function D(e){let{...t}=e;return r.createElement(b.Details,(0,o.Z)({},t,{className:(0,s.Z)("alert alert--info",_,t.className)}))}const x={head:e=>{const t=r.Children.map(e.children,(e=>function(e){var t,n;if(null!=e&&null!=(t=e.props)&&t.mdxType&&null!=e&&null!=(n=e.props)&&n.originalType){const{mdxType:t,originalType:n,...o}=e.props;return r.createElement(e.props.originalType,o)}return e}(e)));return r.createElement(l.Z,e,t)},code:e=>{const{children:t}=e;return(0,r.isValidElement)(t)?t:t.includes("\n")?r.createElement(O,e):r.createElement("code",e)},a:e=>r.createElement(a.default,e),pre:e=>{var t;const{children:n}=e;return(0,r.isValidElement)(n)&&(0,r.isValidElement)(null==n||null==(t=n.props)?void 0:t.children)?n.props.children:r.createElement(O,(0,r.isValidElement)(n)?null==n?void 0:n.props:{...e})},details:e=>{const t=r.Children.toArray(e.children),n=t.find((e=>{var t;return"summary"===(null==e||null==(t=e.props)?void 0:t.mdxType)})),l=r.createElement(r.Fragment,null,t.filter((e=>e!==n)));return r.createElement(D,(0,o.Z)({},e,{summary:n}),l)},h1:(0,P.default)("h1"),h2:(0,P.default)("h2"),h3:(0,P.default)("h3"),h4:(0,P.default)("h4"),h5:(0,P.default)("h5"),h6:(0,P.default)("h6")}}}]);