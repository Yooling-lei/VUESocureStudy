import { isReactive, isReadonly, reactive } from "../reactive";

describe("reactive", () => {
  it("happy path ", () => {
    const original = { foo: 1 };
    // 观测项
    const observed = reactive(original);
    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(1);
    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
    expect(isReadonly(original)).toBe(false);
    expect(isReadonly(observed)).toBe(false);
  });

  // reactive内部嵌套
  it("nested reactive", () => {
    const original = { nested: { foo: 1 }, array: [{ bar: 1 }] };
    const observed = reactive(original);
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });
});
