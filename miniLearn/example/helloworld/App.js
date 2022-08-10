import { h } from "../../lib/my-vue-study.esm.js";

window.self = null;

const test = {
  render() {
    return h("div", { id: "root" }, "sub component");
  },
  isTest: true,
  setup() {
    return {};
  },
};

export const App = {
  // <template>xxxx</template>
  //暂时用render
  render() {
    window.self = this;
    return h(test, {}, "fff");

    // // string类型
    // return h(
    //   "div",
    //   { id: "root", class: ["red", "hard"] },
    //   // this.xxx
    //   // this.$el
    //   // this.emit 等等
    //   "hi, " + this.msg
    // );
    // Array类型
    // return h("div", { id: "root", class: ["red", "hard"] }, [
    //   h("p", { class: "red" }, "hi"),
    //   h("p", { class: "red" }, "hi red"),
    //   h("p", { class: "blue" }, "hi blue"),
    //   "mini-vue",
    // ]);
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
