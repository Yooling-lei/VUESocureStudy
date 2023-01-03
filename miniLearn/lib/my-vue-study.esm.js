const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
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
    // slots children: 组件 + children Object
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const EMPTY_OBJ = {};
const hasChanged = (newVal, oldVal) => !Object.is(newVal, oldVal);
// 首字母大写
// -小写,变大写
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        // 当前effect活跃状态
        this.active = true;
        this._fn = fn;
    }
    run() {
        // 1.会去收集依赖
        // shouldTrack 来做区分
        if (!this.active) {
            return this._fn(); // 让用户可以获得fn的返回值
        }
        shouldTrack = true;
        activeEffect = this; // 指向当前effect对象
        const result = this._fn(); // 调用get,收集依赖
        // rest
        shouldTrack = false;
        return result;
    }
    stop() {
        // 清除已经被收集的当前effect
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop)
                this.onStop();
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
    console.log(effect.deps);
}
// 收集依赖
const targetMap = new WeakMap();
function track(target, key) {
    if (!isTracking())
        return;
    // target -> key -> dep
    // 将依赖收集到容器里(一步步映射)
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    // 收集
    //let obj = reactive(xx)
    //fn1: rel =  obj.test +obj.test2
    //fn2: rel2 = obj.test + 1
    // target:obj
    // key: test,test2
    // targetMap: obj:[test:[fn1,fn2],test2:fn1]
    tarckEffects(dep);
}
function tarckEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    // 反向关联,把当前effect的deps存到对象里
    // fn1.deps =[[fn1,fn2],[fn1,fn2]]
    activeEffect.deps.push(dep);
    // fn1.clearn()后 fn1.deps = [[fn2],[fn2]]
    // 当然 dep的set里也只有[fn2]
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
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
// 初始化effect对象
function effect(fn, options = {}) {
    // fn
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // extend
    extend(_effect, options);
    _effect.onStop = options.onStop;
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    // 把run(fn)的调用直接return出去(bind处理指针问题)
    return runner;
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
        // 依赖收集
        if (!isReadonly) {
            track(target, key);
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

function emit(instance, event, ...args) {
    console.log("emit....", event);
    // instance.props => event对应的回调 onEvent
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler === null || handler === void 0 ? void 0 : handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
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

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        // 具名=> Object
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        parent,
        isMounted: false,
        provides: parent ? parent.provides : {},
        subTree: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
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
        // setup()时可以获取currentInstance
        setCurrentInstance(instance);
        // function:render(), Object:appContext
        // 第二个参数 Context
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        currentInstance = null;
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // TODO: function
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    //if (Component.render) {
    instance.render = Component.render;
    //}
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    var _a;
    // key value
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        // 为了保证inject时,可以获取多层级向上级指向的provides 使用原型链
        const parnetProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        if (provides === parnetProvides) {
            provides = currentInstance.provides = Object.create(parnetProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { parent } = currentInstance;
        const parentProvides = parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppApi(render) {
    return function createApp(rootComponent) {
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
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
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
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    // 若为element 应该处理element
                    processElement(vnode1, vnode2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 处理组件
                    processComponent(vnode1, vnode2, container, parentComponent);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    /** 处理dom element */
    function processElement(n1, n2, container, parentComponent) {
        //init -> update
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2, container, parentComponent);
        }
    }
    /** 更新element */
    function patchElement(n1, n2, container, parentComponent) {
        console.log("....PatchElement");
        console.log("n1", n2);
        console.log("n1", n2);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent);
        // 这个props指的是 elementProp(dom prop)
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent) {
        const { shapeFlag: prevShapeFlag, children: prevChildren } = n1;
        const { shapeFlag, children: nextChildren } = n2;
        // text=>text Array=>text
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // array => text
                // 1. 应该先删除el.children
                unmountChildren(n1.children);
            }
            // 2. el.innerText = text
            if (prevChildren !== nextChildren) {
                hostSetElementText(container, nextChildren);
            }
        }
        else {
            // text => Array
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, "");
                mountChildren(nextChildren, container, parentComponent);
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
        if (oldProps === newProps)
            return;
        for (const key in newProps) {
            const prevProp = oldProps[key];
            const nextProp = newProps[key];
            if (prevProp !== nextProp) {
                // 更新
                hostPatchProp(el, key, prevProp, nextProp);
            }
        }
        if (oldProps === EMPTY_OBJ)
            return;
        for (const key in oldProps) {
            if (!(key in newProps)) {
                hostPatchProp(el, key, oldProps[key], null);
            }
        }
    }
    /** 挂载dom element */
    function mountElement(vnode, container, parentComponent) {
        // vnode -> element -> div
        // 创建dom
        // const el = (vnode.el = document.createElement(vnode.type));
        const el = (vnode.el = hostCreateElement(vnode.type));
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
            mountChildren(vnode.children, el, parentComponent);
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
        hostInsert(el, container);
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
    function mountChildren(children, container, parentComponent) {
        children.forEach((v) => {
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
            }
            else {
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    return { createApp: createAppApi(render) };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, preVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(el, container) {
    container.append(el);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const render = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
function createApp(...args) {
    return render.createApp(...args);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        // 1.看看 value 是不是对象,若是,直接给个reactive即可
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        // isTracking? ref()后 effect(()=>{})才是tracking状态
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 先修改value
        // 判断有没有修改
        // if (!hasChanged(newValue, this._value)) return;
        // 由于_value可能是reactive<Object>,那么对比时需要对比原始引用对比
        // 所以加一个_rawValue保存
        if (!hasChanged(newValue, this._rawValue))
            return;
        this._rawValue = newValue;
        this._value = convert(newValue);
        triggerEffects(this.dep);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        // 同样是get时收集 ##ps1
        tarckEffects(ref.dep);
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}
/**
 * ps1
 * 对于reactive对象来说,依赖收集(effect.track)是基于reactive对象的key去收集的
 * 而对于Ref,只有一个key(value),所以ref的dep只需要一个new Set()
 *
 */

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
