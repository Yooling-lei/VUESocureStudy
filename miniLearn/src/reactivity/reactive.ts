import { isObject } from "../shared/index";
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";

export const reactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();
export const shallowReadonlyMap = new WeakMap();

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

export function reactive(raw): any {
  return createReactiveObject(raw, reactiveMap, mutableHandlers);
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyMap, readonlyHandlers);
}

export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyMap, shallowReadonlyHandlers);
}

function createReactiveObject(target, proxyMap, baseHandlers) {
  if (!isObject(target)) {
    console.warn(`target is not a obj`);
    return target;
  }

  // 如果命中缓存 就直接返回(优化 深度递归reactive时也不会导致多次new和引用问题)
  const existingProxy = proxyMap.get(target);
  if (existingProxy) return existingProxy;
  const proxy = new Proxy(target, baseHandlers);
  proxyMap.set(target, proxy);
  return proxy;
}

export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}
