import { h } from "../../lib/my-vue-study.esm.js";
import { Foo } from "./Foo.js";

window.self = null;

const test = {
  render() {
    let count = 1;
    return h(
      "div",
      {
        id: "root",
        class: ["red"],
        onClick() {
          console.log("clicked");
        },
        onMousedown() {
          console.log("mouseDown");
        },
      },
      [
        h("div", {}, "hi," + this.letMeSee),
        h(Foo, {
          count: count,
          onAdd(a, b) {
            console.log("onAdd", a, b);
          },
          onAddFoo() {
            console.log("onAddFoo");
          },
        }),
      ]
    );
  },
  isTest: true,
  setup() {
    return { letMeSee: "nooooo!" };
  },
};

export const App = {
  // <template>xxxx</template>
  //暂时用render
  name: "App",
  render() {
    window.self = this;
    return h(test, {});

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
