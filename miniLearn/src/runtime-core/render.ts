import { ShapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";

export function render(vnode, container) {
  // patch
  patch(vnode, container, null);
}

function patch(vnode, container, parentComponent) {
  // shapeFlags
  // 用于标识 vnode 类型
  // element类型,component类型
  const { type, shapeFlag } = vnode;
  switch (type) {
    case Fragment:
      // Fragment -> 只渲染 children (用来处理Template 没有顶部节点,或者处理slot下数组)
      processFragment(vnode, container, parentComponent);
      break;
    case Text:
      // 直接渲染文本
      processText(vnode, container);
      break;
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 若为element 应该处理element
        processElement(vnode, container, parentComponent);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // 处理组件
        processComponent(vnode, container, parentComponent);
      }
      break;
  }
}

function processFragment(vnode: any, container: any, parentComponent) {
  mountChildren(vnode, container, parentComponent);
}

function processText(vnode: any, container: any) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
}

/** 处理dom element */
function processElement(vnode: any, container: any, parentComponent) {
  //init -> update
  mountElement(vnode, container, parentComponent);
}

/** 处理vue component */
function processComponent(vnode, container, parentComponent) {
  // 挂载组件
  mountComponent(vnode, container, parentComponent);
}

/** 挂载vue component */
function mountComponent(initialVNode, container, parentComponent) {
  const instance = createComponentInstance(initialVNode, parentComponent);
  // 执行component的setup() 并挂载到instance
  setupComponent(instance);
  // 执行component的render(),渲染子节点
  setupRenderEffect(instance, initialVNode, container);
}

/** 挂载dom element */
function mountElement(vnode: any, container: any, parentComponent) {
  // vnode -> element -> div
  // 创建dom
  const el = (vnode.el = document.createElement(vnode.type));
  // children
  // string array
  const { children, shapeFlag } = vnode;
  // children类型
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // text_children
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // array_children
    mountChildren(vnode, el, parentComponent);
  }
  // props object
  const { props } = vnode;
  for (const key in props) {
    const val = props[key];
    // 注册事件
    // on + Event name
    const isOn = (key: string) => /^on[A-Z]/.test(key);

    if (isOn(key)) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
  }
  container.append(el);
}

/** 递归渲染子节点 */
function mountChildren(vnode, container, parentComponent) {
  vnode.children.forEach((v) => {
    patch(v, container, parentComponent);
  });
}

function setupRenderEffect(instance, vnode, container) {
  const { proxy } = instance;
  // render()时this绑定实例的proxy对象
  const subTree = instance.render.call(proxy);

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container, instance);

  // element mounted =>
  vnode.el = subTree.el;
}
