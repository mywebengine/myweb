/*!
 * myweb 0.9.2
 * (c) 2019-2023 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */
import "./addons.js";
import { Render } from "./MyWeb/Render.js";
import { LocParams } from "./LocParams.js";
import { ViewParams } from "./ViewParams.js";
import { IMyWeb } from "./MyWeb/IMyWeb.js";
export declare const myweb: Render;
export declare const loc: LocParams;
export declare const view: ViewParams;
export declare const my: {
    myweb: IMyWeb;
    loc: LocParams;
    view: ViewParams;
    createLineNo?(url: string, html: string, $src: Node): void;
    getLineNo?($e: HTMLElement): string | null;
    debugLevel: number;
};
//# sourceMappingURL=myweb.d.ts.map