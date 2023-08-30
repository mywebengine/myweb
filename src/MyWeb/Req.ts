import {CommandWithArgs} from "./CommandWithArgs.js";
import {Sync} from "./Sync.js";

export class Req {
	$src: HTMLElement;
	str: string;
	expr: string;
	scope: Record<string | symbol, unknown>;
	event: Event | null;
	sync: Sync;
	commandWithArgs: CommandWithArgs;

	constructor(
		$src: HTMLElement,
		str: string,
		expr: string,
		scope: Record<string | symbol, unknown>,
		event: Event | null,
		sync: Sync,
		commandWithArgs: CommandWithArgs
	) {
		this.$src = $src;
		this.str = str;
		this.expr = expr;
		this.scope = scope;
		this.event = event;
		this.sync = sync;
		this.commandWithArgs = commandWithArgs;
	}
}
