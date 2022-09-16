const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === "object";
};

// 收集依赖
const targetMap = new WeakMap();
// 触发依赖
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        // 嵌套收集依赖
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key:${key} set 失败,因为 target为readonly`, target);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();
function reactive(raw) {
    return createReactiveObject(raw, reactiveMap, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyMap, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyMap, shallowReadonlyHandlers);
}
function createReactiveObject(target, proxyMap, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target is not a obj`);
        return target;
    }
    // 如果命中缓存 就直接返回(优化 深度递归reactive时也不会导致多次new和引用问题)
    const existingProxy = proxyMap.get(target);
    if (existingProxy)
        return existingProxy;
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const publicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState
        const { setupState, props } = instance;
        const hasOwn = (val) => Object.prototype.hasOwnProperty.call(val, key);
        if (hasOwn(setupState)) {
            return setupState[key];
        }
        else if (hasOwn(props)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter)
            return publicGetter(instance);
    },
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
    };
    return component;
}
function setupComponent(instance) {
    // TODO:
    // initSlots();
    initProps(instance, instance.vnode.props);
    // 初始化一个有状态的组件
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    //ctx
    // 实例化instance的proxy对象
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        // function:render(), Object:appContext
        const setupResult = setup(shallowReadonly(instance.props));
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
    // shapeFlags
    // 用于标识 vnode 类型
    // element类型,component类型
    const { shapeFlag } = vnode;
    // 若为element 应该处理element
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
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
function mountComponent(initialVNode, container) {
    const instance = createComponentInstance(initialVNode);
    // 执行component的setup() 并挂载到instance
    setupComponent(instance);
    // 执行component的render(),渲染子节点
    setupRenderEffect(instance, initialVNode, container);
}
/** 挂载dom element */
function mountElement(vnode, container) {
    // vnode -> element -> div
    // 创建dom
    const el = (vnode.el = document.createElement(vnode.type));
    // children
    // string array
    const { children, shapeFlag } = vnode;
    // children类型
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        // text_children
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        // array_children
        mountChildren(vnode, el);
    }
    // props object
    const { props } = vnode;
    for (const key in props) {
        const val = props[key];
        // 注册事件
        // on + Event name
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
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

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    // children
    if (typeof children === "string") {
        vnode.shapeFlag = vnode.shapeFlag | 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag = vnode.shapeFlag | 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
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

export { createApp, h };
