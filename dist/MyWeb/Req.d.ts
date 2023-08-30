import { CommandWithArgs } from "./CommandWithArgs.js";
import { Sync } from "./Sync.js";
export declare class Req {
    $src: HTMLElement;
    str: string;
    expr: string;
    scope: Record<string | symbol, unknown>;
    event: Event | null;
    sync: Sync;
    commandWithArgs: CommandWithArgs;
    constructor($src: HTMLElement, str: string, expr: string, scope: Record<string | symbol, unknown>, event: Event | null, sync: Sync, commandWithArgs: CommandWithArgs);
}
//# sourceMappingURL=Req.d.ts.map