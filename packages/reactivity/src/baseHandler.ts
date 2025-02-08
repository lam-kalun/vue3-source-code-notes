import { isObject } from '@vue/shared';
import { track, trigger } from './reactiveEffect';
import { reactive } from './reactive';
import { ReactiveFlags } from './constants';

// proxy 需要搭配Reflect使用
export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    // 当取值时，应该让响应式属性和effect映射起来
    // 收集这个对象上的属性，和用到其属性的effect关联起来
    track(target, key);
    // 不用target[key]理由: /question-1.ts
    // receiver为getter调用时的this值
    const res = Reflect.get(target, key, receiver);

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

  set(target, key, value, receiver) {
    // 找到属性，让对应effect重新执行
    const oldValue = target[key];
    // target[key]值变化后，再触发trigger
    // 不然触发trigger后，再触发effect.run时会触发get重新收集依赖后，返回的就是旧值
    // receiver为setter调用时的this值
    const result = Reflect.set(target, key, value, receiver);
    // 相同值不会触发effect(也很明显了)
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return result;
  }
}