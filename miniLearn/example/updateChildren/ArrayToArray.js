import { ref, h } from "../../lib/my-vue-study.esm.js";

// 1.左侧对比
// const prevChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "F"),
//   h("p", { key: "C" }, "C"),
// ];

// const nextChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "D" }, "D"),
//   h("p", { key: "E" }, "E"),
// ];

// 2.右侧对比
// const prevChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C" }, "C"),
// ];

// const nextChildren = [
//   h("p", { key: "D" }, "D"),
//   h("p", { key: "E" }, "E"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C" }, "C"),
// ];

// 3. 新的包含老的
// 3-1 :  (左侧对比)
// const prevChildren = [h("p", { key: "A" }, "A"), h("p", { key: "B" }, "B")];

// const nextChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C" }, "C"),
//   h("p", { key: "D" }, "D"),
// ];
// i:2, e1:1 e2:3

// 3-2 : (右侧对比) unshift
// const prevChildren = [h("p", { key: "A" }, "A"), h("p", { key: "B" }, "B")];

// const nextChildren = [
//   h("p", { key: "C" }, "C"),
//   h("p", { key: "D" }, "D"),
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
// ];
// i: 0, e1: -1, e2:1

// 4: 老的包含新的
// 4-1: 左侧对比

// const prevChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C" }, "C"),
//   h("p", { key: "D" }, "D"),
// ];
// const nextChildren = [h("p", { key: "A" }, "A"), h("p", { key: "B" }, "B")];
// // i=2, e1=3, e2=1

// 4-2: 右侧对比

const prevChildren = [
  h("p", { key: "A" }, "A"),
  h("p", { key: "B" }, "B"),
  h("p", { key: "C" }, "C"),
  h("p", { key: "D" }, "D"),
];
const nextChildren = [h("p", { key: "C" }, "C"), h("p", { key: "D" }, "D")];
// i=0, e1=0, e2=-1

export default {
  name: "TextToArray",
  setup() {
    const isChange = ref(false);
    // @ts-ignore
    window.isChange = isChange;
    return { isChange };
  },
  render() {
    const self = this;
    return self.isChange
      ? h("div", {}, nextChildren)
      : h("div", {}, prevChildren);
  },
};
