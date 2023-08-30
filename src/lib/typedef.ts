//usage: const d = typedef(new Date()).of(Date).test(d => d <= new Date()).value
export function typedef(val: unknown) {
	return new typedefCheck(val);
}

class typedefCheck {
	value: unknown;

	constructor(value: unknown) {
		this.value = value;
	}

	eq(val: unknown) {
		if (this.value === val) {
			return this;
		}
		throw new Error("Value " + this.value + " !== " + val);
	}

	of(ins: Function) {
		if (this.value instanceof ins) {
			return this;
		}
		throw new Error("Value " + this.value + " isn't instanceof " + ins);
	}

	elementsOf(ins: Function) {
		if (!Array.isArray(this.value)) {
			throw new Error("Value " + this.value + " isn't array");
		}
		for (const i of this.value) {
			if (!(i instanceof ins)) {
				throw new Error("Value " + i + ", array items isn't instanceof " + ins);
			}
		}
		return this;
	}

	fieldsOf(ins: Function) {
		if (typeof this.value !== "object" || this.value === null) {
			throw new Error("Value " + this.value + " isn't object");
		}
		for (const i in this.value) {
			// @ts-ignore
			const val = this.value[i];
			if (!(val instanceof ins)) {
				throw new Error("Value " + val + ", object props isn't instanceof " + ins);
			}
		}
		return this;
	}

	array() {
		if (Array.isArray(this.value)) {
			return this;
		}
		throw new Error("Value " + this.value + " isn't array");
	}

	object() {
		if (typeof this.value === "object" && this.value !== null) {
			return this;
		}
		throw new Error("Value " + this.value + " isn't object");
	}

	bool() {
		if (this.value === true || this.value === false) {
			return this;
		}
		throw new Error("Value " + this.value + " isn't bool");
	}

	number() {
		if (typeof this.value === "number") {
			return this;
		}
		throw new Error("Value " + this.value + " isn't number");
	}

	string() {
		if (typeof this.value === "string") {
			return this;
		}
		throw new Error("Value " + this.value + " isn't string");
	}

	null() {
		if (this.value === null) {
			return this;
		}
		throw new Error("Value " + this.value + " isn't null");
	}

	notNull() {
		if (this.value !== null) {
			return this;
		}
		throw new Error("Value " + this.value + " is null");
	}

	undef() {
		if (this.value === undefined) {
			return this;
		}
		throw new Error("Value " + this.value + " isn't undefined");
	}

	notUndef() {
		if (this.value !== undefined) {
			return this;
		}
		throw new Error("Value " + this.value + " is undefined");
	}

	func() {
		if (typeof this.value === "function") {
			return this;
		}
		throw new Error("Value " + this.value + " isn't function");
	}

	test(func: Function) {
		if (func(this.value)) {
			return this;
		}
		throw new Error("Value " + this.value + " didn't pass the functional test");
	}
}
