import { computed } from "../computed";
import { reactive } from "../reactive";

describe("computed", () => {
  it("happy path", () => {
    const user = reactive({
      age: 1,
    });

    const age = computed(() => {
      return user.age;
    });
    expect(age.value).toBe(1);
  });
  it("should comput lazily", () => {
    const value = reactive({ foo: 1 });
    const getter = jest.fn(() => {
      return value.foo;
    });

    const cValue = computed(getter);

    //lazy
    expect(getter).not.toHaveBeenCalled();

    expect(cValue.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);
    // catch
    expect(cValue.value).toBe(1); //get
    expect(getter).toHaveBeenCalledTimes(1);

    value.foo = 2; // trigger -> effect -> get 重新执行
    expect(getter).toHaveBeenCalledTimes(1);

    expect(cValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
