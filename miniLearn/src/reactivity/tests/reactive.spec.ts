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
});
