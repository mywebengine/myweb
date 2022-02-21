export function type(val) {
	return new typeCheck(val);
}
function typeCheck(val) {
	this.val = val;
}
typeCheck.prototype = {
	eq(val) {
		if (this.val === val) {
			return this;
		}
		throw new Error("Value " + this.val + " !== " + val);
	},
	of(ins) {
		if (this.val instanceof ins) {
			return this;
		}
		throw new Error("Value " + this.val + " isn't instanceof " + ins);
	},
	elsOf(t) {
		if (!Array.isArray(this.val)) {
			throw new Error("Value " + this.val + " isn't array");
		}
		for (const i of this.val) {
			if (!(i instanceof t)) {
				throw new Error("Value " + i + ", array items isn't instanceof " + t);
			}
		}
		return this;
	},
	propsOf(t) {
		if (typeof this.val !== "object" || this.val === null) {
			throw new Error("Value " + this.val + " isn't object");
		}
		for (const i in this.val) {
			if (!(this.val[i] instanceof t)) {
				throw new Error("Value " + this.val[i] + ", object props isn't instanceof " + t);
			}
		}
		return this;
	},
	array() {
		if (Array.isArray(this.val)) {
			return this;
		}
		throw new Error("Value " + this.val + " isn't array");
	},
	object() {
		if (typeof this.val === "object" && this.val !== null) {
			return this;
		}
		throw new Error("Value " + this.val + " isn't object");
	},
	bool() {
		if (this.val === true || this.val === false) {
			return this;
		}
		throw new Error("Value " + this.val + " isn't bool");
	},
	number() {
		if (typeof this.val === "number") {
			return this;
		}
		throw new Error("Value " + this.val + " isn't number");
	},
	string() {
		if (typeof this.val === "string") {
			return this;
		}
		throw new Error("Value " + this.val + " isn't string");
	},
	null() {
		if (this.val === null) {
			return this;
		}
		throw new Error("Value " + this.val + " isn't null");
	},
	notNull() {
		if (this.val !== null) {
			return this;
		}
		throw new Error("Value " + this.val + " is null");
	},
	undef() {
		if (this.val === undefined) {
			return this;
		}
		throw new Error("Value " + this.val + " isn't undefined");
	},
	notUndef() {
		if (this.val !== undefined) {
			return this;
		}
		throw new Error("Value " + this.val + " is undefined");
	},
	func() {
		if (typeof this.val === "function") {
			return this;
		}
		throw new Error("Value " + this.val + " isn't function");
	},
	test(func) {
		if (func(this.val)) {
			return this;
		}
		throw new Error("Value " + this.val + " didn't pass the functional test");
	}
};
