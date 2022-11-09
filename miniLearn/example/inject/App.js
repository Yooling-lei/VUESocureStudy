import { h, inject, provide } from "../../lib/my-vue-study.esm.js";

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal");
    provide("bar", "barVal");
  },
  render() {
    return h("div", {}, [h("p", {}, "Provider"), h(Middle)]);
  },
};

const Middle = {
  name: "Provider",
  setup() {
    const firstFoo = inject("foo");
    provide("foo", "middleFoo");
    return { firstFoo };
  },
  render() {
    return h("div", {}, [
      h("p", {}, `Middle....${this.firstFoo}`),
      h(Consumer),
    ]);
  },
};

const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");

    const baz = inject("baz", "defaultBaz");

    return { foo, bar, baz };
  },
  render() {
    return h("div", {}, `Consumer: - ${this.foo} - ${this.bar} -${this.baz} `);
  },
};

export { Provider as App };
