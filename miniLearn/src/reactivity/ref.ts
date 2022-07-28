import { hasChanged, isObject } from "../shared";
import { isTracking, tarckEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  private _value: any;
  public dep;
  private _rawValue: any;
  constructor(value) {
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
    if (!hasChanged(newValue, this._rawValue)) return;
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

export function ref(value) {
  return new RefImpl(value);
}

/**
 * ps1
 * 对于reactive对象来说,依赖收集(effect.track)是基于reactive对象的key去收集的
 * 而对于Ref,只有一个key(value),所以ref的dep只需要一个new Set()
 *
 */
