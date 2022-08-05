import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // patch
}

function patch(vnode, container) {
  // 处理组件
  processComponent(vnode, container);

  // 判断是不是element类型
}

function processComponent(vnode, container) {
  // 挂载组件
  mountComponent(vnode, container);
}

function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode);
  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
  const subTree = instance.render();

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container);
}
