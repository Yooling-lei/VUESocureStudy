import { h } from "../../lib/my-vue-study.esm.js";

export const Foo = {
  setup(props) {
    // props.count
    console.log(props);
    // props readonly
  },
  render() {
    return h("div", {}, "foo:" + this.count);
  },
};
