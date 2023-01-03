/* eslint-disable no-unused-vars */
// @ts-nocheck
import { h } from "../../lib/my-vue-study.esm.js";
import ArrayToText from "./ArrayToText.js";
import ArrayToArray from "./ArrayToArray.js";
import TextToText from "./TextToText.js";
import TextToArray from "./TextToArray.js";

export default {
  name: "App",
  setup() {},
  render() {
    return h("div", { tId: 1 }, [
      h("p", {}, "主页"),
      // h(ArrayToText),
      // h(TextToText),
      h(ArrayToArray),
    ]);
  },
};
