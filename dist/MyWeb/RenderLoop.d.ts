import { Loading } from "./Loading.js";
import { Sync } from "./Sync.js";
import { LocalState } from "./LocalState.js";
export declare abstract class RenderLoop extends Loading {
    checkScrollAnimations(): void;
    protected renderLoop(syncInThisRender: Set<Sync>): Promise<void>;
    private isAddScrollAnimationsEvent;
    protected addScrollAnimationsEvent($e: HTMLElement): void;
    protected testLocalEventsBySrcId(local: Map<number, LocalState>, srcId: number): void;
    private addAnimation;
    private isAnimationVisible;
    private dispatchLocalEvents;
    private dispatchLocalEventsBySrcId;
}
//# sourceMappingURL=RenderLoop.d.ts.map