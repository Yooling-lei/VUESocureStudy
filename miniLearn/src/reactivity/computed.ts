import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  // private _getter: any;
  private _dirty = true;
  private _value: any;
  private _effect: ReactiveEffect;
  constructor(getter) {
    // this._getter = getter;
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }

  get value() {
    // _dirty来控制是否重新计算
    // 当依赖的响应式对象触发trigger时,_dirty应该为true
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
