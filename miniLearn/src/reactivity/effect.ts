class ReactiveEffect {
  private _fn: any;

  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this; // 指向当前effect对象
    this._fn();
  }
}

// 收集依赖
const targetMap = new Map();
export function track(target, key) {
  // target -> key -> dep
  // 将依赖收集到容器里(一步步映射)
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep: Set<any> = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  // 收集
  dep.add(activeEffect);
}

// 触发依赖
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    effect.run();
  }
}

let activeEffect;
export function effect(fn) {
  //fn
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}
