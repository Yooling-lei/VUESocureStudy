import { h } from "../../lib/my-vue-study.esm.js";

export const App = {
  // <template>xxxx</template>
  //暂时用render
  render() {
    // string类型
    // return h("div", { id: "root", class: ["red", "hard"] }, "hi, " + this.msg);
    // Array类型
    return h("div", { id: "root", class: ["red", "hard"] }, [
      h("p", { class: "red" }, "hi"),
      h("p", { class: "red" }, "hi red"),
      h("p", { class: "blue" }, "hi blue"),
      "mini-vue",
    ]);
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
