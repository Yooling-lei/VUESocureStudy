import { getCurrentInstance, h } from "../../lib/my-vue-study.esm.js";

export const Foo = {
  setup() {
    const instance = getCurrentInstance();
    console.log(instance);
    return {};
  },
  render() {
    const btn = h("button", { onClick: this.emitAdd }, "clickToEmit");
    const foo = h("p", {}, "foo:" + this.count);
    return h("div", {}, [foo, btn]);
  },
};
