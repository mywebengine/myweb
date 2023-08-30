export class ViewParams {
    scrollTop;
    scrollLeft;
    clientWidth;
    clientHeight;
    constructor($e) {
        this.setState($e);
    }
    setState($e) {
        if ($e !== null) {
            this.scrollTop = $e.scrollTop;
            this.scrollLeft = $e.scrollLeft;
            this.clientWidth = $e.clientWidth;
            this.clientHeight = $e.clientHeight;
        }
    }
}
