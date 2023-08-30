import { Req } from "../MyWeb/Req.js";
import { Q_arr } from "../MyWeb/Q_arr.js";
import { Command } from "./Command.js";
export declare class Attr extends Command {
    render(req: Req): Promise<null>;
    q_render(req: Req, arr: Q_arr[], isLast: Set<number>): Promise<null>;
    private renderByValue;
    private setClick;
    private getName;
}
//# sourceMappingURL=Attr.d.ts.map