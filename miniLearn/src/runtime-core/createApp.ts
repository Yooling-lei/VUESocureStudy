import { render } from "./render";
import { createVNode } from "./vnode";

export function createApp(rootComponent) {
  //setup(),render()
  return {
    mount(rootContainer) {
      // 先转换为虚拟节点vNode
      // component => vnode
      // 所有逻辑操作都基于vnode做处理
      const vnode = createVNode(rootComponent);
      render(vnode, rootContainer);
    },
  };
}
