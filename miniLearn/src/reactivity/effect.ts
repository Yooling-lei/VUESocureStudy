class ReactiveEffect {
  private _fn: any;

  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this; // 指向当前effect对象
    return this._fn(); // 让用户可以获得fn的返回值
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

// 初始化effect对象
let activeEffect;
export function effect(fn) {
  //fn
  const _effect = new ReactiveEffect(fn);
  _effect.run();
  // 把run(fn)的调用直接return出去(bind处理指针问题)
  return _effect.run.bind(_effect);
}
