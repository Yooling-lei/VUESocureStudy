import { h } from "../../lib/my-vue-study.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  // <template>xxxx</template>
  //暂时用render
  name: "App",
  render() {
    const app = h("div", {}, "App");
    // slot => 在app里给foo传参,传递一个vnode
    // 让foo渲染这个vnode
    // const foo = h(Foo, {}, [
    //   h("p", {}, "I am slot1"),
    //   h("p", {}, "i am slot2"),
    // ]);
    // 具名=> array => Object
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => [
          h("p", {}, "I am header" + age),
          h("p", {}, "sub-header"),
        ],
        footer: () => h("p", {}, "i am footer"),
      }
    );

    return h("div", {}, [app, foo]);
  },
  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
