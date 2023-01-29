const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        key: props === null || props === void 0 ? void 0 : props.key,
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

const queue = [];
// 是否已经创建了开始微任务
let isFlushPending = false;
function nextTick(fn) {
    return fn ? Promise.resolve().then(fn) : Promise.resolve();
}
function queueJobs(job) {
    // 假如有100次update,每次job都一样(vnode instance.update function是一样的)
    // 调用100次queueJobs
    // 则执行顺序为
    // 100*mainTask => queue = [job]
    // 100*microTask =>第一次 queue[0].() ,其他99次return
    // mainTask
    queuePush(job);
    // microTask
    queueFlush();
}
function queuePush(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        console.log("run job");
        job === null || job === void 0 ? void 0 : job();
    }
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const isString = (value) => typeof value === "string";
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
    $props: (i) => i.props,
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
        next: null,
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
    if (compiler && !compiler.render) {
        Component.render = compiler(Component.template);
    }
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
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
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

function shouldUpdateComponent(preVNode, nextvNode) {
    const { props: prevProps } = preVNode;
    const { props: nextProps } = nextvNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
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
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    // 若为element 应该处理element
                    processElement(vnode1, vnode2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 处理组件
                    processComponent(vnode1, vnode2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    /** 处理dom element */
    function processElement(n1, n2, container, parentComponent, anchor) {
        //init -> update
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
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
                mountChildren(nextChildren, container, parentComponent, anchor);
            }
            else {
                // array => array Diff 算法
                patchKeyedChildren(prevChildren, nextChildren, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, patentAnchor) {
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
            }
            else {
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
            }
            else {
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
        }
        else if (i > e2) {
            // i > e2 表示 左侧索引大于了新节点的右侧索引, 说明新节点完全被旧节点包含
            // 直接遍历删除需要删除的旧节点
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间对比
            let s1 = i;
            let s2 = i;
            // 新节点的总数
            const toBePatched = e2 - i + 1;
            // 当前处理的数量
            let patched = 0;
            // 新节点可以映射
            const keyToNewIndexMap = new Map();
            // 新旧节点索引映射
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false;
            let maxNewIndexSoFar = 0;
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            console.log("=========>toBePatched", toBePatched);
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                // 新节点 key:oldIndex
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // for循环一遍老节点们
            // 若老节点的 key 在新节点里面有,则说明存在在新节点, 将新旧序列建立映射关系
            // 若没有,则删除了,调用hostRemove
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // 优化:
                // 当旧节点数量大于新节点时,若新节点已被patch完,则其他节点都应删除
                if (patched >= toBePatched) {
                    console.log("优化删除=============>");
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                // 有key用map,没有key则循环
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = 0; j <= e2; j++) {
                        if (isSameVnodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 如果旧节点没有在新的list里有索引(没了),删除
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    // 优化,当新节点索引不是递增时,才可能需要移动
                    // 比如 c,d,e => g,c,d,e  这时c,d,e全部递增,只用在c前插入g
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // +1 避免为0
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            console.log("===>newIndexToOldIndexMap", newIndexToOldIndexMap);
            // 优化: 怎么确定节点需要移动
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            // const increasingNewIndexSequence = [3, 4];
            // 最长递增序列的索引
            console.log("========>toBePatched", toBePatched);
            console.log("========>increasingNewIndexSequence", increasingNewIndexSequence);
            // A,B,(C,D,E),F,G
            // A,B,(E,C,D),F,G
            //    [3,4,5]
            //     C,D,E
            //    [5,3,4] ===>
            //     E,C,D
            // A,B,E,C,D,F,G
            //最长递增索引为 [3,4] , 在新的 E,C,D里索引为 [1,2]
            //则应该是 C,D不动, E从原来的节点,移动到 递增序列之前
            //这时从右遍历ToBePatched得出 哪个节点需要移动
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                // 循环ToBePatched ,2,1,0
                // j:increasing: [1,2]
                // 第一次 i=2, i == j[1]
                // 也就是D节点,一开始就是固定序列,不用移动
                // 第二次 i=1, C节点,固定序列,不用移动
                // 第三次 i=0, e节点,j超出索引,需要移动
                // 应该把e移动到c,也就是锚点索引为 i+ s2(左侧相同数) = 需要移动节点在全部新节点里的索引 +1 = 锚点索引
                function getIndexs() {
                    const nextIndex = i + s2;
                    const nextChild = c2[nextIndex];
                    const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                    return { nextChild, anchor };
                }
                if (newIndexToOldIndexMap[i] === 0) {
                    const { nextChild, anchor } = getIndexs();
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (!moved) {
                    continue;
                }
                else if (j < 0 || i !== increasingNewIndexSequence[j]) {
                    const { nextChild, anchor } = getIndexs();
                    hostInsert(nextChild.el, container, anchor);
                }
                else {
                    j--;
                }
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
    function mountElement(vnode, container, parentComponent, anchor) {
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
        if (!n1) {
            // 挂载组件
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        instance.next = n2;
        if (shouldUpdateComponent(n1, n2)) {
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    /** 挂载vue component */
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
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
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                // render()时this绑定实例的proxy对象
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                // vnode -> patch
                // vnode -> element -> mountElement
                patch(null, subTree, container, instance, anchor);
                // element mounted =>
                vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log("really update");
                // 更新Component
                const { proxy, next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            // 为了实现微任务更新
            scheduler() {
                console.log("scheduler update");
                queueJobs(instance.update);
            },
        });
    }
    return { createApp: createAppApi(render) };
}
function updateComponentPreRender(instance, nextVNode) {
    instance.next = null;
    instance.vnode = nextVNode;
    instance.props = nextVNode.props;
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    console.log(result);
    return result;
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
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor);
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
    setElementText,
});
function createApp(...args) {
    return render.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    nextTick: nextTick,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementVNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    toDisplayString: toDisplayString
});

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

const TO_DISPLAY_STRING = "toDisplayString";
const CREATE_ELEMENT_VNODE = "createElementVNode";

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    // 注:preamble(序言)
    genFunctionPreamble(ast, context);
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(", ");
    push(`function ${functionName}(${signature}){`);
    push("return ");
    genNode(ast.codegenNode, context);
    push("}");
    return {
        code: context.code,
    };
}
/** 获取导入functions eg: const {xxx} = Vue */
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = "Vue";
    // 判断有没有差值
    const aliasHelper = (s) => `${s}:_${s}`;
    // 有差值时就需要toDisplayString
    const { helpers } = ast;
    if (helpers.length > 0) {
        push(`const { ${helpers.map(aliasHelper).join(", ")} } = ${VueBinging} `);
    }
    push("\n");
    push("return ");
}
/** 根据type具体生成 render函数内部结构 */
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const { children } = node;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genElement(node, context) {
    const { push } = context;
    const { tag, props, children } = node;
    push(`_${CREATE_ELEMENT_VNODE}(`);
    // genNode(children, context);
    genNodeList(genNullable([tag, props, children]), context);
    push(")");
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(",");
        }
    }
}
function genNullable(args) {
    return args.map((arg) => arg !== null && arg !== void 0 ? arg : "null");
}
// 文本render
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
// 差值render interpolation 内部content为 expression
function genInterpolation(node, context) {
    const { push } = context;
    push(`_${TO_DISPLAY_STRING}(`);
    genNode(node.content, context);
    push(")");
}
function genExpression(node, context) {
    console.log("==========>", node);
    const { push } = context;
    push(`${node.content}`);
}
// 生成上下文
function createCodegenContext() {
    const context = {
        code: "",
        push(source) {
            context.code += source;
        },
    };
    return context;
}

function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const { source } = context;
        if (source.startsWith("{{")) {
            node = parseInterpolation(context);
        }
        else if (source[0] === "<" && /[a-z]/i.test(source[1])) {
            node = parseElement(context, ancestors);
        }
        else {
            node = parseText(context);
        }
        nodes.push(node);
        console.log("==================>", node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    // 1.当source 为空
    // 2.当遇到结束标签时
    const { source } = context;
    if (source.startsWith("</")) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const { tag } = ancestors[i];
            if (startsWithEndTagOpen(source, tag)) {
                return true;
            }
        }
    }
    // if (parentTag && source.startsWith(`</${parentTag}>`)) return true;
    return !source;
}
function parseText(context) {
    let endIndex = context.source.length;
    let endTokens = ["<", "{{"];
    for (let i = 0; i < endTokens.length; i++) {
        const element = endTokens[i];
        const index = context.source.indexOf(element);
        if (index > -1 && index < endIndex) {
            endIndex = index;
        }
    }
    // 1.获取content
    const content = parseTextData(context, endIndex);
    // 2.推进
    advanceBy(context, content.length);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content: content,
    };
}
function parseTextData(context, length) {
    return context.source.slice(0, length);
}
function parseElement(context, ancestors) {
    // 1.解析 tag
    const element = parseTag(context, 0 /* TagType.Start */);
    // ancestors.push(element.tag);
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺少结束标签:${element.tag}`);
    }
    return element;
}
function startsWithEndTagOpen(source, tag) {
    return source.slice(2, 2 + tag.length) === tag;
}
function parseTag(context, type) {
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    if (type === 1 /* TagType.End */)
        return;
    // 2.删除处理完成的
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag: tag,
    };
}
// Path {{xxx}}
function parseInterpolation(context) {
    //{{messge}} =>
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    advanceBy(context, openDelimiter.length);
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawContent = parseTextData(context, rawContentLength);
    const content = rawContent.trim();
    advanceBy(context, closeDelimiter.length + content.length);
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content: content,
        },
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createRoot(children) {
    return { children, type: 4 /* NodeTypes.ROOT */ };
}
function createParserContext(content) {
    return {
        source: content,
    };
}

function transform(root, options = {}) {
    // 1.遍历 深度优先
    const context = createTransformContext(root, options);
    traverseNode(root, context);
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
// 根目录function生成
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = child;
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
function traverseNode(node, context) {
    const { nodeTransforms } = context;
    const exitFns = [];
    if (nodeTransforms) {
        for (let i = 0; i < nodeTransforms.length; i++) {
            const transform = nodeTransforms[i];
            const onExit = transform === null || transform === void 0 ? void 0 : transform(node, context);
            if (onExit)
                exitFns.push(onExit);
        }
        switch (node.type) {
            case 0 /* NodeTypes.INTERPOLATION */:
                context.helper(TO_DISPLAY_STRING);
                break;
            case 4 /* NodeTypes.ROOT */:
            case 2 /* NodeTypes.ELEMENT */:
                traverseChildren(node, context);
                break;
        }
        let i = exitFns.length;
        while (i--) {
            exitFns[i]();
        }
    }
}
function traverseChildren(node, context) {
    const { children } = node;
    for (let i = 0; i < children.length; i++) {
        const next = children[i];
        traverseNode(next, context);
    }
}

function createVNodeCall(tag, props, children) {
    const vnodeElement = {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
    return vnodeElement;
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            context.helper(CREATE_ELEMENT_VNODE);
            // 中间处理层
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps;
            // children
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
}

function transformText(node) {
    const isText = (node) => node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */;
    let currentContainer;
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

// 项目出口
function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

export { createApp, createVNode as createElementVNode, createRenderer, createTextVNode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, registerRuntimeCompiler, renderSlots, toDisplayString };
