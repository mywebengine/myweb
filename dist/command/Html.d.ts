import { Req } from "../MyWeb/Req.js";
import { Q_arr } from "../MyWeb/Q_arr.js";
import { Command } from "./Command.js";
export declare class Html extends Command {
    isCustomHtml: boolean;
    render(req: Req): Promise<null>;
    q_render(req: Req, arr: Q_arr[], isLast: Set<number>): Promise<null>;
    private renderByValue;
}
//# sourceMappingURL=Html.d.ts.map