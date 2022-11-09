import { getCurrentInstance } from "./component";

export function provide(key, value) {
  // key value
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    let { provides } = currentInstance;
    // 为了保证inject时,可以获取多层级向上级指向的provides 使用原型链
    const parnetProvides = currentInstance.parent?.provides;
    if (provides === parnetProvides) {
      provides = currentInstance.provides = Object.create(parnetProvides);
    }

    provides[key] = value;
  }
}

export function inject(key, defaultValue) {
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    const { parent } = currentInstance;
    const parentProvides = parent.provides;
    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      if (typeof defaultValue === "function") {
        return defaultValue();
      }
      return defaultValue;
    }
  }
}
