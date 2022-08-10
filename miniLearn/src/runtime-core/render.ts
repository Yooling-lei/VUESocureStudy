import { isObject } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // patch
  patch(vnode, container);
}

function patch(vnode, container) {
  // TODO: 判断类型:element类型,component类型
  // 若为element 应该处理element
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    // 处理组件
    processComponent(vnode, container);
  }
}

/** 处理dom element */
function processElement(vnode: any, container: any) {
  //init -> update
  mountElement(vnode, container);
}

/** 处理vue component */
function processComponent(vnode, container) {
  // 挂载组件
  mountComponent(vnode, container);
}

/** 挂载vue component */
function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode);
  // 执行component的setup() 并挂载到instance
  setupComponent(instance);
  // 执行component的render(),渲染子节点
  setupRenderEffect(instance, vnode, container);
}

/** 挂载dom element */
function mountElement(vnode: any, container: any) {
  // vnode -> element -> div
  // 创建dom
  const el = (vnode.el = document.createElement(vnode.type));
  // children
  // string array
  const { children } = vnode;
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChildren(vnode, el);
  }
  // props object
  const { props } = vnode;
  for (const key in props) {
    const val = props[key];
    el.setAttribute(key, val);
  }
  container.append(el);
}

/** 递归渲染子节点 */
function mountChildren(vnode, container) {
  vnode.children.forEach((v) => {
    patch(v, container);
  });
}

function setupRenderEffect(instance, vnode, container) {
  const { proxy } = instance;
  // render()时this绑定实例的proxy对象
  const subTree = instance.render.call(proxy);

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container);

  // element mounted =>
  vnode.el = subTree.el;
}
