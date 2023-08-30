export class RenderParam {
	srcId: number;
	scope: Record<string | symbol, unknown> | null;
	str: string;
	isLinking: boolean;
	isLazyRender = false;
	srcIds: Set<number> = new Set();
	$els: HTMLElement[] | null = null;

	constructor(srcId: number, scope: Record<string | symbol, unknown> | null, str: string, isLinking: boolean) {
		this.srcId = srcId;
		this.scope = scope;
		this.str = str;
		this.isLinking = isLinking;
	}
}
