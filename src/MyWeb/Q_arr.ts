export class Q_arr {
	$src: HTMLElement;
	scope: Record<string | symbol, unknown>;
	scopePatch: Record<string, unknown> | null;

	constructor($src: HTMLElement, scope: Record<string, unknown>, scopePatch: Record<string, unknown> | null) {
		this.$src = $src;
		this.scope = scope;
		this.scopePatch = scopePatch; //info если srcBy$src.get($src).scope === null, то и scopePatch === null
	}
}
