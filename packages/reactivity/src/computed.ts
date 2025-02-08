import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { track, trigger } from "./ref";

class ComputedRefImpl {
  public _value;
  public effect;
  public dep;
  constructor(getter, public setter) {
    // 内置effect，管理计算属性的dirty属性，控制是否触发getter
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        // 计算属性依赖的值变化了，触发当前dep记录的effect渲染
        trigger(this);
      }
    );
  }

  get value() {
    if (this.effect.dirty) {
      // 触发依赖值的get，让其和this.effect关联
      this._value = this.effect.run(); // 相当于=() => getter(this._value)
      // 让当前ComputedRef与外层effect(template)关联
      track(this);
    }
    return this._value;
  }

  set value(v) {
    this.setter(v);
  }
}

export function computed(getterOrOptions) {
  const onlyGetter = isFunction(getterOrOptions);

  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter);
};