import { effect } from "../reactivity/effect";
import { ShapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";

export function render(vnode, container) {
  // patch
  patch(null, vnode, container, null);
}

// n1 -> 老的节点
// n2 -> 新的节点
function patch(vnode1, vnode2, container, parentComponent) {
  // shapeFlags
  // 用于标识 vnode 类型
  // element类型,component类型
  const { type, shapeFlag } = vnode2;
  switch (type) {
    case Fragment:
      // Fragment -> 只渲染 children (用来处理Template 没有顶部节点,或者处理slot下数组)
      processFragment(vnode1, vnode2, container, parentComponent);
      break;
    case Text:
      // 直接渲染文本
      processText(vnode1, vnode2, container);
      break;
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 若为element 应该处理element
        processElement(vnode1, vnode2, container, parentComponent);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // 处理组件
        processComponent(vnode1, vnode2, container, parentComponent);
      }
      break;
  }
}

function processFragment(n1, n2: any, container: any, parentComponent) {
  mountChildren(n2, container, parentComponent);
}

function processText(n1, n2, container: any) {
  const { children } = n2;
  const textNode = (n2.el = document.createTextNode(children));
  container.append(textNode);
}

/** 处理dom element */
function processElement(n1, n2, container: any, parentComponent) {
  //init -> update
  if (!n1) {
    mountElement(n2, container, parentComponent);
  } else {
    patchElement(n1, n2, container);
  }
}

function patchElement(n1, n2, container) {
  console.log("....PatchElement");
  console.log("n1", n2);
  console.log("n1", n2);
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

/** 处理vue component */
function processComponent(n1, n2, container, parentComponent) {
  // 挂载组件
  mountComponent(n2, container, parentComponent);
}

/** 挂载vue component */
function mountComponent(initialVNode, container, parentComponent) {
  const instance = createComponentInstance(initialVNode, parentComponent);
  // 执行component的setup() 并挂载到instance
  setupComponent(instance);
  // 执行component的render(),渲染子节点
  setupRenderEffect(instance, initialVNode, container);
}

/** 递归渲染子节点 */
function mountChildren(vnode, container, parentComponent) {
  vnode.children.forEach((v) => {
    patch(null, v, container, parentComponent);
  });
}

function setupRenderEffect(instance, vnode, container) {
  // 为了达到 reactive update => re render()
  // 1. 在执行render() 时, 应该由effect 包裹
  // 2. 初始化时走path,更新应该走更新
  effect(() => {
    if (!instance.isMounted) {
      const { proxy } = instance;
      // render()时this绑定实例的proxy对象
      const subTree = (instance.subTree = instance.render.call(proxy));

      // vnode -> patch
      // vnode -> element -> mountElement
      patch(null, subTree, container, instance);

      // element mounted =>
      vnode.el = subTree.el;
      instance.isMounted = true;
    } else {
      const { proxy } = instance;
      const subTree = instance.render.call(proxy);
      const prevSubTree = instance.subTree;

      instance.subTree = subTree;
      patch(prevSubTree, subTree, container, instance);
    }
  });
}
