import { Q_renderTag } from "./Q_renderTag.js";
export declare class Render extends Q_renderTag {
    render($src: HTMLElement | undefined, delay: number | undefined, scope?: Record<string | symbol, unknown> | null, isLinking?: boolean): Promise<unknown>;
    renderBySrcIds(srcIds: Set<number>): Promise<unknown>;
    setDelay(time: number, cb?: Function): void;
    getCurRender(): Promise<void>;
    get$srcScope($e: HTMLElement): Record<string | symbol, unknown>;
    private runRender;
    private renderRenderParams;
    private renderByRenderParamsGroupedByDescr;
    private q_renderByRenderParams;
    private prepareRenderParam;
    private prpDeleteDescrId;
    private checkSync;
    private cancelSync;
    private getPosStat;
    private infoBySrcIds;
}
//# sourceMappingURL=Render.d.ts.map