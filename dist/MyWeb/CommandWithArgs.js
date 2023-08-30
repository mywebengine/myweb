export class CommandWithArgs {
    commandName;
    command;
    args;
    constructor(commandName, command, args) {
        this.commandName = commandName;
        this.command = command;
        this.args = args;
    }
}
