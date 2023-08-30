export class LocParams {
    // @ts-ignore
    origin;
    // @ts-ignore
    href;
    // @ts-ignore
    pathname;
    // @ts-ignore
    query;
    // @ts-ignore
    hash;
    constructor(urlStr) {
        this.setState(urlStr);
    }
    setState(urlStr) {
        const url = new URL(urlStr);
        this.origin = url.origin;
        this.href = url.href;
        this.pathname = url.pathname;
        this.query = new Map();
        for (const [n, v] of url.searchParams) {
            this.query.set(n, v);
        }
        this.hash = {
            pathname: url.hash.substring(1),
        };
    }
}
