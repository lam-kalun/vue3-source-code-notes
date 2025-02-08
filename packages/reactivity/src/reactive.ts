import { isObject } from "@vue/shared";
import { mutableHandlers } from "./baseHandler";
import { ReactiveFlags } from "./constants";

// 记录处理过的后果，以便复用，key值为target对象
const reactiveMap = new WeakMap();

function createReactiveObject(target) {
  // 必须是对象
  if (!isObject(target)) {
    return target;
  }

  // target对象已经是reactive了
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  // 取缓存，有便直接返回
  const exitsProxy = reactiveMap.get(target);
  if (exitsProxy) {
    return exitsProxy;
  }

  const proxy = new Proxy(target, mutableHandlers);
  // 根据对象缓存处理后的结果
  reactiveMap.set(target, proxy);

  return proxy;
}

export function reactive(target) {
  return createReactiveObject(target);
}

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}