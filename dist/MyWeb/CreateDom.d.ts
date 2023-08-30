import { Descr } from "./Descr.js";
import { Base_MyWeb } from "./Base_MyWeb.js";
import { Src } from "./Src.js";
export declare abstract class CreateDom extends Base_MyWeb {
    createSrc($e: HTMLElement, descr: Descr | null, asOneIdx: Map<string, number> | null, idx: Map<string, number> | null): Src;
    createDescr($e: HTMLElement, srcId: number): Descr;
    prepare$src($i: Node, isLinking: boolean): void;
    joinText($e: HTMLElement | DocumentFragment): void;
    private createAttr;
    private prepare$src_createSrc;
    private prepare_getSrc;
    private replaceTextBlocks;
}
//# sourceMappingURL=CreateDom.d.ts.map