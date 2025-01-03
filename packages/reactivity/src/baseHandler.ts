import { isObject } from '@vue/shared';
import { track, trigger } from './reactiveEffect';
import { reactive } from './reactive';

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
    const res = Reflect.get(target, key, recevier);

    // 当取值也是对象时，递归代理，和用到其属性的effect关联
    if (isObject(res)) {
      // 比如state.address.n，.address会触发state的get，.n会触发state.address的get
      // 如果不进行递归代理，state.address只是一个普通的对象，不是proxy对象
      // state.address是一个对象{n: 1}，会返回{n: 1}代理后的对象
      // 然后.n会触发{n: 1}的n的get
      return reactive(res);
    }

    return res;
  },

  set(target, key, value, recevier) {
    // 找到属性，让对应effect重新执行
    const oldValue = target[key];
    const result = Reflect.set(target, key, value, recevier);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return result;
  }
}