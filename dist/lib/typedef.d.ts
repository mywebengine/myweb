export declare function typedef(val: unknown): typedefCheck;
declare class typedefCheck {
    value: unknown;
    constructor(value: unknown);
    eq(val: unknown): this;
    of(ins: Function): this;
    elementsOf(ins: Function): this;
    fieldsOf(ins: Function): this;
    array(): this;
    object(): this;
    bool(): this;
    number(): this;
    string(): this;
    null(): this;
    notNull(): this;
    undef(): this;
    notUndef(): this;
    func(): this;
    test(func: Function): this;
}
export {};
//# sourceMappingURL=typedef.d.ts.map