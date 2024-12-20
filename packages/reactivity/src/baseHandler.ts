import { track } from './reactiveEffect';

export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive" //基本上唯一
}

// proxy 需要搭配Reflect使用
export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, recevier) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    // 当取值时，应该让响应式属性和effect映射起来
    // 收集这个对象上的属性，和用到其属性的effect关联起来
    track(target, key);
    // 不用target[key]理由: /question-1.ts
    return Reflect.get(target, key, recevier);
  },

  set(target, key, value, recevier) {
    // 找到属性，让对应effect重新执行
    // todo

    return Reflect.set(target, key, value, recevier);
  }
}