import { h } from "../../lib/my-vue-study.esm.js";

export const App = {
  // <template>xxxx</template>
  //暂时用render
  render() {
    return h("div", "hi, " + this.msg);
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
