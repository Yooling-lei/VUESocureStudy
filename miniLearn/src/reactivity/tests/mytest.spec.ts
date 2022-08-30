import { convertTriageLevel } from "../test";

describe("Name of the group", () => {
  it("should trans to number", () => {
    expect(convertTriageLevel("一级")).toBe(1);
    expect(convertTriageLevel("1")).toBe(1);
    expect(convertTriageLevel(1)).toBe(1);
    expect(convertTriageLevel(6)).toBe("未");
    expect(convertTriageLevel("6")).toBe("未");
    expect(convertTriageLevel("")).toBe("未");
  });

  it("should trans to Text", () => {
    expect(convertTriageLevel("1", true)).toBe("一级");
    expect(convertTriageLevel("二级", true)).toBe("二级");
    expect(convertTriageLevel("粑粑", true)).toBe("未知");
    expect(convertTriageLevel(1, true)).toBe("一级");
    expect(convertTriageLevel(8, true)).toBe("未知");
    expect(convertTriageLevel("", true)).toBe("未知");
  });
});
