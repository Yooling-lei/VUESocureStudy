import { ref } from "../../lib/my-vue-study.esm.js";

export const App = {
  name: "App",
  template: `<div>hi,{{message}} : {{count}}</div>`,
  setup() {
    // @ts-ignore
    const count = (window.count = ref(1));
    return {
      count,
      message: "mini-vue",
    };
  },
};
