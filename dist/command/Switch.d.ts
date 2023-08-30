import { Req } from "../MyWeb/Req.js";
import { If } from "./If.js";
export declare class Switch extends If {
    protected ifCmdName: string;
    protected elseifCmdName: string;
    protected elseCmdName: string;
    render(req: Req): Promise<import("../MyWeb/RenderRes.js").RenderRes | null>;
}
//# sourceMappingURL=Switch.d.ts.map