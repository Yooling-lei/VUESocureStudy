import { h, renderSlots } from "../../lib/my-vue-study.esm.js";

export const Foo = {
  setup() {},
  render() {
    console.log("=========>", this);
    const foo = h("p", {}, "foo");
    // foo.vnode.children
    // 具名:?
    // 1.获取到要渲染的元素
    // 2.要获取到渲染的位置

    // 作用域
    // Object=>Object<Func>
    const age = 18;
    return h("div", {}, [
      renderSlots(this.$slots, "header", { age: age }),
      foo,
      renderSlots(this.$slots, "footer"),
    ]);
  },
};
