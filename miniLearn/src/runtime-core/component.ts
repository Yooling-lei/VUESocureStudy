import { proxyRefs } from "../index";
import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { publicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode, parent) {
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
    emit: () => {},
  };
  component.emit = emit.bind(null, component) as any;
  return component;
}
export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  // 初始化一个有状态的组件
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
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
function handleSetupResult(instance, setupResult: any) {
  // TODO: function
  if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult);
  }
  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;

  if (compiler && !compiler.render) {
    Component.render = compiler(Component.template);
  }
  //if (Component.render) {
  instance.render = Component.render;
  //}
}

let currentInstance = null;
export function getCurrentInstance() {
  return currentInstance;
}

export function setCurrentInstance(instance) {
  currentInstance = instance;
}

let compiler;
export function registerRuntimeCompiler(_compiler) {
  compiler = _compiler;
}
