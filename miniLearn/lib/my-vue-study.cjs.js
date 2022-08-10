'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isObject = (val) => {
    return val !== null && typeof val === "object";
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
    };
    return component;
}
function setupComponent(instance) {
    // TODO:
    // initProps();
    // initSlots();
    // 初始化一个有状态的组件
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        // function:render(), Object:appContext
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // TODO: function
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    //if (Component.render) {
    instance.render = Component.render;
    //}
}

function render(vnode, container) {
    // patch
    patch(vnode, container);
}
function patch(vnode, container) {
    // TODO: 判断类型:element类型,component类型
    // 若为element 应该处理element
    if (typeof vnode.type === "string") {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        // 处理组件
        processComponent(vnode, container);
    }
}
/** 处理dom element */
function processElement(vnode, container) {
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
    setupRenderEffect(instance, container);
}
/** 挂载dom element */
function mountElement(vnode, container) {
    // 创建dom
    const el = document.createElement(vnode.type);
    // children
    // string array
    const { children } = vnode;
    if (typeof children === "string") {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
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
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container);
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

function createApp(rootComponent) {
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

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
