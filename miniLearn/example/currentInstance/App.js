import { getCurrentInstance, h } from "../../lib/my-vue-study.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  name: "App",
  render() {
    return h("div", {}, [h(Foo, {})]);
  },

  setup() {
    const instance = getCurrentInstance();
    console.log(instance);
    return {};
  },
};
