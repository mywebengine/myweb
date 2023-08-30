import {ICommand} from "./ICommand.js";

export class CloneNodeOn {
	command: ICommand;
	str: string;
	expr: string;

	constructor(command: ICommand, str: string, expr: string) {
		this.command = command;
		this.str = str;
		this.expr = expr;
	}
}
