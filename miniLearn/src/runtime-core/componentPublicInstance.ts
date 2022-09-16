const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
};

export const publicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // setupState
    const { setupState, props } = instance;

    const hasOwn = (val) => Object.prototype.hasOwnProperty.call(val, key);
    if (hasOwn(setupState)) {
      return setupState[key];
    } else if (hasOwn(props)) {
      return props[key];
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) return publicGetter(instance);
  },
};
