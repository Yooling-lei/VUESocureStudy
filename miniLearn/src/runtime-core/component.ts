import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { publicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
  };
  component.emit = emit.bind(null, component) as any;
  return component;
}
export function setupComponent(instance) {
  // TODO:
  // initSlots();

  initProps(instance, instance.vnode.props);
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
    // function:render(), Object:appContext
    // 第二个参数 Context
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    handleSetupResult(instance, setupResult);
  }
}
function handleSetupResult(instance, setupResult: any) {
  // TODO: function
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }
  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;
  //if (Component.render) {
  instance.render = Component.render;
  //}
}
