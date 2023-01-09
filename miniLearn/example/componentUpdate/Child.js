import { h } from "../../lib/my-vue-study.esm.js";

export default {
  name: "Child",
  setup() {},
  render() {
    return h("div", {}, [
      h("div", {}, "child - props - msg :" + this.$props.msg),
    ]);
  },
};
