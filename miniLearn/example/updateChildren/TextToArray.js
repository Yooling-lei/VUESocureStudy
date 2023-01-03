import { ref, h } from "../../lib/my-vue-study.esm.js";
const nextChildren = "newChildren";
const prevChildren = [h("div", {}, "A"), h("div", {}, "B")];

export default {
  name: "TextToArray",
  setup() {
    const isChange = ref(false);
    // @ts-ignore
    window.isChange = isChange;
    return { isChange };
  },
  render() {
    const self = this;
    return self.isChange === true
      ? h("div", {}, prevChildren)
      : h("div", {}, nextChildren);
  },
};
