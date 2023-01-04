import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppApi } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  function render(vnode, container) {
    // patch
    patch(null, vnode, container, null, null);
  }

  // n1 -> 老的节点
  // n2 -> 新的节点
  function patch(vnode1, vnode2, container, parentComponent, anchor) {
    // shapeFlags
    // 用于标识 vnode 类型
    // element类型,component类型
    const { type, shapeFlag } = vnode2;
    switch (type) {
      case Fragment:
        // Fragment -> 只渲染 children (用来处理Template 没有顶部节点,或者处理slot下数组)
        processFragment(vnode1, vnode2, container, parentComponent, anchor);
        break;
      case Text:
        // 直接渲染文本
        processText(vnode1, vnode2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 若为element 应该处理element
          processElement(vnode1, vnode2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理组件
          processComponent(vnode1, vnode2, container, parentComponent, anchor);
        }
        break;
    }
  }

  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processText(n1, n2, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  /** 处理dom element */
  function processElement(n1, n2, container: any, parentComponent, anchor) {
    //init -> update
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  /** 更新element */
  function patchElement(n1, n2, container, parentComponent, anchor) {
    // console.log("....PatchElement");
    // console.log("n1", n2);
    // console.log("n1", n2);

    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el, parentComponent, anchor);
    // 这个props指的是 elementProp(dom prop)
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const { shapeFlag: prevShapeFlag, children: prevChildren } = n1;
    const { shapeFlag, children: nextChildren } = n2;

    // text=>text Array=>text
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // array => text
        // 1. 应该先删除el.children
        unmountChildren(n1.children);
      }
      // 2. el.innerText = text
      if (prevChildren !== nextChildren) {
        hostSetElementText(container, nextChildren);
      }
    } else {
      // text => Array
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(nextChildren, container, parentComponent, anchor);
      } else {
        // array => array Diff 算法
        patchKeyedChildren(
          prevChildren,
          nextChildren,
          container,
          parentComponent,
          anchor
        );
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    patentAnchor
  ) {
    const l2 = c2.length;
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    function isSameVnodeType(n1, n2) {
      // type
      // key
      return n1.type === n2.type && n1.key === n2.key;
    }

    // 左端对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnodeType(n1, n2)) {
        // 如果两个node相等,则递归,看是否需要更新
        patch(n1, n2, container, parentComponent, patentAnchor);
      } else {
        break;
      }
      i++;
    }

    // 右端对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnodeType(n1, n2)) {
        // 如果两个node相等,则递归,看是否需要更新
        patch(n1, n2, container, parentComponent, patentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    console.log("differ==========>i", i);
    console.log("differ==========>e1", e1);
    console.log("differ==========>e2", e2);

    // i: 从左对比时,从第几个元素索引开始有差异

    // e1: 从右对比(大到小), 从第几个元素索引(旧的node)开始有差异
    // e2: 从右对比(大到小), 从第几个元素索引(新的node)开始有差异

    if (i > e1) {
      // i>e1 表示情况1 :左侧索引大于了旧节点右侧索引, 说明旧节点完全被新节点包含
      if (i <= e2) {
        // 同时, 若左对比索引,小于新节点右侧索引时, 说明 新节点有新的node应该插入
        // nextPos为新增节点的锚点索引,应该是 新节点的有变化的右数第一个
        // 也就是 e2 (有差异的右数第一个) + 1 (最后一个没差异的)
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // i > e2 表示 左侧索引大于了新节点的右侧索引, 说明新节点完全被旧节点包含
      // 直接遍历删除需要删除的旧节点
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 中间对比
      let s1 = i;
      let s2 = i;

      // 新节点的总数
      const toBePatched = e2 - i + 1;
      console.log("=========>toBePatched", toBePatched);

      // 当前处理的数量
      let patched = 0;

      const keyToNewIndexMap = new Map();

      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        // 优化:
        // 当旧简单数量大于新节点时,若新节点已被patch完,则其他节点都应删除
        if (patched >= toBePatched) {
          console.log("优化删除=============>");

          hostRemove(prevChild.el);
          continue;
        }

        let newIndex: number | undefined;

        // 有key用map,没有key则循环
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (let j = 0; j < e2; j++) {
            if (isSameVnodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }

        // 判断这个老节点还是否存在
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      hostRemove(el);
    }
  }

  function patchProps(el, oldProps, newProps) {
    if (oldProps === newProps) return;

    for (const key in newProps) {
      const prevProp = oldProps[key];
      const nextProp = newProps[key];
      if (prevProp !== nextProp) {
        // 更新
        hostPatchProp(el, key, prevProp, nextProp);
      }
    }
    if (oldProps === EMPTY_OBJ) return;
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  }

  /** 挂载dom element */
  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    // vnode -> element -> div
    // 创建dom
    // const el = (vnode.el = document.createElement(vnode.type));
    const el = (vnode.el = hostCreateElement(vnode.type));
    // children
    // string array
    const { children, shapeFlag } = vnode;
    // children类型
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // text_children
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // array_children
      mountChildren(vnode.children, el, parentComponent, anchor);
    }
    console.log("mountElemnt...vnode=>", vnode);

    // props object
    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      // 注册事件
      // on + Event name
      // const isOn = (key: string) => /^on[A-Z]/.test(key);
      hostPatchProp(el, key, null, val);
    }
    // container.append(el);
    hostInsert(el, container, anchor);
  }

  /** 处理vue component */
  function processComponent(n1, n2, container, parentComponent, anchor) {
    // 挂载组件
    mountComponent(n2, container, parentComponent, anchor);
  }

  /** 挂载vue component */
  function mountComponent(initialVNode, container, parentComponent, anchor) {
    const instance = createComponentInstance(initialVNode, parentComponent);
    // 执行component的setup() 并挂载到instance
    setupComponent(instance);
    // 执行component的render(),渲染子节点
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  /** 递归渲染子节点 */
  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }

  function setupRenderEffect(instance, vnode, container, anchor) {
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
        patch(null, subTree, container, instance, anchor);

        // element mounted =>
        vnode.el = subTree.el;
        instance.isMounted = true;
      } else {
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;

        instance.subTree = subTree;
        patch(prevSubTree, subTree, container, instance, anchor);
      }
    });
  }
  return { createApp: createAppApi(render) };
}
