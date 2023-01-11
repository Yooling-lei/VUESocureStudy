// @ts-nocheck
import {
  h,
  nextTick,
  ref,
  getCurrentInstance,
} from "../../lib/my-vue-study.esm.js";

export const App = {
  name: "App",
  setup() {
    const msg = ref("123");
    const count = ref(1);

    window.msg = msg;

    const changeChildProps = () => {
      msg.value = "456";
    };
    const instance = getCurrentInstance();

    const changeCount = async () => {
      for (let i = 0; i < 100; i++) {
        count.value++;
      }
      console.log(instance);
      await nextTick();
      console.log(instance);
    };

    return { msg, count, changeCount, changeChildProps };
  },
  render() {
    return h("div", {}, [
      h("button", { onClick: this.changeCount }, "change self count"),
      h("p", {}, "count:" + this.count),
    ]);
  },
};
