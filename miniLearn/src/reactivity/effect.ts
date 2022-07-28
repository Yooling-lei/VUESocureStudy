import { extend } from "../shared";

let activeEffect;
let shouldTrack;
class ReactiveEffect {
  private _fn: any;
  deps = [];
  // 当前effect活跃状态
  active = true;
  onStop?: () => void;

  constructor(fn, public scheduler?) {
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
      if (this.onStop) this.onStop();
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
  console.log(effect.deps);
}

// 收集依赖
const targetMap = new Map();
export function track(target, key) {
  if (!isTracking()) return;
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
  //let obj = reactive(xx)
  //fn1: rel =  obj.test +obj.test2
  //fn2: rel2 = obj.test + 1
  // target:obj
  // key: test,test2
  // targetMap: obj:[test:[fn1,fn2],test2:fn1]

  tarckEffects(dep);
}

export function tarckEffects(dep) {
  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  // 反向关联,把当前effect的deps存到对象里

  // fn1.deps =[[fn1,fn2],[fn1,fn2]]
  activeEffect.deps.push(dep);
  // fn1.clearn()后 fn1.deps = [[fn2],[fn2]]
  // 当然 dep的set里也只有[fn2]
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

// 触发依赖
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  triggerEffects(dep);
}
export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

// 初始化effect对象
export function effect(fn, options: any = {}) {
  // fn
  const _effect = new ReactiveEffect(fn, options.scheduler);
  // extend
  extend(_effect, options);

  _effect.onStop = options.onStop;
  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  // 把run(fn)的调用直接return出去(bind处理指针问题)
  return runner;
}

// stop方法
export function stop(runner) {
  runner.effect.stop();
}
