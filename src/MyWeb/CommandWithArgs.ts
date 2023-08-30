import {ICommand} from "./ICommand.js";

export class CommandWithArgs {
	commandName: string;
	command: ICommand;
	args: string[];

	constructor(commandName: string, command: ICommand, args: string[]) {
		this.commandName = commandName;
		this.command = command;
		this.args = args;
	}
}
