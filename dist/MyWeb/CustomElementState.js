export class CustomElementState {
    type;
    key;
    readyState;
    url;
    req;
    res;
    $fr = null;
    $tags = null; //?? todo
    scope;
    constructor(readyState, type = "close", url, req, res, scope) {
        switch (type) {
            case "open":
            case "close":
            case "include":
                break;
            default:
                if (type) {
                    throw new Error("Import type not supported (open, close pr default include)");
                }
                type = "include";
        }
        this.type = type;
        const key = req === null ? (res === null ? url : res) : req.method === "GET" ? url : req;
        if (key === null) {
            throw new Error("key === null");
        }
        this.key = key;
        this.readyState = readyState; //loading, complete
        this.url = url;
        this.req = req;
        this.res = res;
        this.scope = scope;
    }
}
