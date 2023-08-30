export class ImportLoading {
    type;
    waitTime;
    isShow;
    constructor(req) {
        const args = req.commandWithArgs.args;
        const a0 = args[0];
        const a1 = args[1];
        this.type = a0 !== "" && a0 !== undefined ? a0 : "";
        this.waitTime = a1 !== "" && a1 !== undefined ? a1 : "";
        this.isShow = this.waitTime !== "" || this.type !== "";
    }
}
