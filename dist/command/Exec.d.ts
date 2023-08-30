import { Req } from "../MyWeb/Req.js";
import { Q_arr } from "../MyWeb/Q_arr.js";
import { Command } from "./Command.js";
export declare class Exec extends Command {
    isHasScope: boolean;
    render(req: Req): Promise<null>;
    q_render(req: Req, arr: Q_arr[], isLast: Set<number>): Promise<null>;
}
//# sourceMappingURL=Exec.d.ts.map