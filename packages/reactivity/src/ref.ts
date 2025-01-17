import { toReactive } from "./reactive";
import { activeEffect, trackEffect, triggerEffects } from './effect';
import { createDep } from "./reactiveEffect";
import { ReactiveFlags } from "./baseHandler";

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
    // 相同值不会触发effect(也很明显了)
    if (newValue !== this.rawValue) {
      this.rawValue = newValue;
      this._value = newValue;
      // this._value值变化后，再触发trigger
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
      ref.dep = createDep(() => ref.dep = undefined);
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

export function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}

class ObjectRefImpl {
  public __v_isRef = true;
  constructor(public _object, public _key) {}

  // 先简单理解，这里不用Reflect的原因是传进来的_object是响应式，已做过track
  // 而new Proxy时，传入的target不是响应式的，直接target[key]不会触发get

  // new Proxy时使用Reflect，是因为其get是返回的proxy对象获取时才会触发，
  // 而原对象里有getter，getter里的this不会触发proxy对象的get，会漏收集track，
  // 这里如果_object里有getter，也不会触发这里的get，只会触发proxy监听里的get，
  // 但是这里不用收集track，不触发也无所谓
  get value() {
    return this._object[this._key];
    // return Reflect.get(this._object, this._key, toRefs(this._object));
  }

  set value(newValue) {
    this._object[this._key] = newValue;
  }
}

// 大多用于解构reactive
export function toRefs(object) {
  const res = {};
  for ( const key in object ) {
    res[key] = toRef(object, key);
  }
  return res;
}

export function proxyRefs(objectWithRefs) {
  if (objectWithRefs[ReactiveFlags.IS_REACTIVE]) {
    return objectWithRefs;
  }
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      // 如果target[key]是ref，就用不着receiver改变this,
      // 但是如果不是ref，而getter里面有this，就要再次经过本get来判断this.xxx是不是ref,
      // 需不需要.value取值，和reactive相同原理（reactive需要getter里this.xxx触发get来track）
      const res = Reflect.get(target, key, receiver);
      return res.__v_isRef ? res.value : res;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      // oldValue: 100; value: 200;
      // oldValue: 100; value: ref(200);
      // oldValue: ref(100); value: 200; true
      // oldValue: ref(100); value: ref(200);
      // 从中看出target[key]不是ref时，需要用到receiver改变this，
      // 如果setter里面有this，就要再次经过本set来判断this.xxx是不是ref，需不需要.value取值，
      // 和reactive相同原理（reactive需要setter里this.xxx触发set来trigger）
      if (oldValue.__v_isRef && !value.__v_isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    }
  })
}