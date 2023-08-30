import { Eval2 } from "./Eval2.js";
export declare abstract class Loading extends Eval2 {
    showLoading($e: HTMLElement, testFunc: Function, type?: string, waitTime?: number | string): Promise<void>;
    private createLoading;
    private decLoading;
    private toggleLoading;
}
//# sourceMappingURL=Loading.d.ts.map