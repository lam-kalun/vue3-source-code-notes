import { toReactive } from "./reactive";
import { activeEffect, trackEffect, triggerEffects } from './effect';
import { createDep } from "./reactiveEffect";

function createRef(value) {
  return new RefImpl(value);
}

class RefImpl {
  public __v_isRef = true;
  public _value; // 用来保存ref的值
  public dep; // 当前被包裹属性的effect

  constructor(public rawValue) {
    // 如果是对象，就用reactive()
    this._value = toReactive(rawValue);
  }

  get value() {
    // 收集当前被包裹属性所映射的effect
    track(this);
    return this._value;
  }

  set value(newValue) {
    // 触发当前被包裹属性所映射的effect
    if (newValue !== this.rawValue) {
      this.rawValue = newValue;
      this._value = newValue;
      // his._value值变化后，再触发trigger
      // 不然触发trigger后，再触发effect.run时会触发get重新收集依赖后，返回的就是旧值
      trigger(this);
    }
  }
}

function track(ref) {
  // 因为effect实例的run方法结束后，activeEffect为undefined
  // 触发get时，有activeEffect这个属性，说明这个被包裹的属性，是在effect中运行的
  if (activeEffect) {
    if (!ref.dep) {
      ref.dep = createDep(() => ref.dep = undefined );
    }
    trackEffect(activeEffect, ref.dep);
  }
}

function trigger(ref) {
  if (ref.dep) {
    triggerEffects(ref.dep); // 触发依赖更新
  }
}

export function ref(value) {
  return createRef(value);
}