/*!
 * myweb/pimport.js v0.9.0
 * (c) 2019 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */import{getURL}from"./util.js";export let isDynamicImport;try{new Function("import('')"),isDynamicImport=!0}catch(a){}let sync=0;export default function pimport(a){return isDynamicImport?new Function(`return import("${a.qq()}")`)():(a instanceof String&&(a=getURL(a)),new Promise((b,c)=>{const d=document.createElement("script");d.type="module";const e="importKey"+ ++sync;d.src=URL.createObjectURL(new Blob([`import * as m from "${a.qq()}"; self.${e} = m;`],{type:"text/javascript"})),d.onload=()=>{const f=self[e];clear(d,e),f?b(self[e]):c(new Error("Failed to import: "+a))},d.onerror=()=>{clear(d,e),c(new Error("Failed to import: "+a))},document.head.append(d)}))}function clear(a,b){delete self[b],a.remove(),URL.revokeObjectURL(a.src)}self.pimport=pimport;