import { h } from "../../lib/my-vue-study.esm.js";

export const Foo = {
  setup(props, { emit }) {
    // props.count
    console.log(props);
    // props readonly
    const emitAdd = () => {
      emit("add", 1, 2);
      emit("add-foo");
      console.log("emitAdd...");
    };
    return { emitAdd };
  },
  render() {
    const btn = h("button", { onClick: this.emitAdd }, "clickToEmit");
    const foo = h("p", {}, "foo:" + this.count);
    return h("div", {}, [foo, btn]);
  },
};
