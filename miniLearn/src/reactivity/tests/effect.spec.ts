import { reactive } from "../reactive";
import { effect } from "../effect";
/**
 * 这个单元测试需要的效果是什么呢?
 * 1.当reactive对象内的属性修改时,
 * 2.依赖reactive对象的变量也应该发生变化(触发依赖(依赖项跟踪修改))
 */

// 依赖收集effect
// get收集依赖,set触发依赖
describe("effect", () => {
  // skip(分布)
  it("happy path", () => {
    const user = reactive({ age: 10 });
    let nextAge;
    effect(() => {
      // 模拟compute,类似 const nestAge = computed(()=>user.age + 1)
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);

    //update
    user.age++;
    expect(nextAge).toBe(12);
  });

  // 调用effect之后返回一个function(runner)=>fn->return 返回值
  // 也就是调用runner返回内部的返回值
  it("should return runner when call effect", () => {
    // effect(fn) => function(runner) => fn => return
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });
    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });
});
