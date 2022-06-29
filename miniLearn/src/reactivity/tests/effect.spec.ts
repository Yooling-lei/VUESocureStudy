import { reactive } from "../reactive";
import { effect, stop } from "../effect";
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

it("scheduler", () => {
  // 1.通过effect的第二个参数给定的一个schedule的fn
  // 2.effect 第一次执行的时候,还会执行 fn
  // 3.当响应式对象 set update 时就不会再执行fn了 而是执行 scheduler
  // 4.当执行 runner 的时候,会再次执行 fn
  let dummy;
  let run: any;
  const scheduler = jest.fn(() => {
    run = runner;
  });

  const obj = reactive({ foo: 1 });
  const runner = effect(
    () => {
      dummy = obj.foo;
    },
    { scheduler }
  );

  expect(scheduler).not.toHaveBeenCalled();
  expect(dummy).toBe(1);

  obj.foo++; // 这时不执行fn,执行schedule(也就是给run指向runner)
  expect(scheduler).toHaveBeenCalledTimes(1);
  // 尽管响应式对象++了,被依赖对象不变
  expect(dummy).toBe(1);
  // 调用runner
  run();
  // runner后被依赖对象赋值为响应式对象
  expect(dummy).toBe(2);

  // 猜测,这样做的意义
  // 在整个事件结束后调用runner,赋值依赖对象,而不是每次update都修改
  // 减少赋值的次数? 可能在后续dom操作更方便调用(钩子?runner时去更新dom?)
  // 或者单纯节省性能?实现nexttrick?
});

// 调用stop后,被依赖的对象更新后,有依赖的响应式对象停止更新(unRef?)
it("stop ", () => {
  let dummy;
  const obj = reactive({ prop: 10 });
  const runner = effect(() => {
    dummy = obj.prop;
  });
  obj.prop = 2;
  expect(dummy).toBe(2);
  stop(runner);
  obj.prop = 3;
  expect(dummy).toBe(2);

  // 调用runner后,正常update
  runner();
  expect(dummy).toBe(3);
});

// 允许传入一个stop时执行的回调函数
it("onStop ", () => {
  const obj = reactive({ foo: 1 });
  const onStop = jest.fn(() => {});
  let dummy;
  const runner = effect(
    () => {
      dummy = obj.foo;
    },
    { onStop }
  );
  stop(runner);
  expect(onStop).toBeCalledTimes(1);
});
