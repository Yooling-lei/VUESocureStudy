import { h, ref } from "../../lib/my-vue-study.esm.js";

export const App = {
  name: "App",
  setup() {
    const count = ref(0);
    const props = ref({ foo: "foo", bar: "bar" });

    const onClick = () => {
      count.value++;
    };

    const onChangePropsDemo1 = () => {
      props.value.foo = "new-foo";
    };

    const onChangePropsDemo2 = () => {
      props.value.foo = undefined;
    };

    const onChangePropsDemo3 = () => {
      props.value = { foo: "foo" };
    };

    return {
      count,
      props,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
    };
  },
  render() {
    return h("div", { id: "root", ...this.props }, [
      h("div", {}, "count:" + this.count),
      h("button", { onClick: this.onClick }, "click"),
      h(
        "button",
        { onClick: this.onChangePropsDemo1 },
        "changeProps - 值改变了 - 修改"
      ),
      h(
        "button",
        { onClick: this.onChangePropsDemo2 },
        "changeProps - 值变为undefined - 删除"
      ),
      h(
        "button",
        { onClick: this.onChangePropsDemo3 },
        "changeProps - 值没了 - 删除"
      ),
    ]);
  },
};
