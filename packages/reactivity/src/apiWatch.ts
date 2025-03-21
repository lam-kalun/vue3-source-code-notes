import { isFunction, isNumber, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";
import { isRef } from "./ref";


export function watch(source, cb, options = {} as any) {
  return doWatch(source, cb, options);
}

export function watchEffect(source, options = {} as any) {
  return doWatch(source, null, options);
}

// { name: '欧滋', age: 2010, address: { lion: 2 } }
function traverse(source, depth, currentDepth = 0, seen = new Set()) {
  // 如果source是obj，遍历source内的所有属性
  if (!isObject(source)) {
    return source;
  }
  // 如果有层数，就监听层数，否则遍历全部层
  if (depth) {
    if (currentDepth >= depth) {
      return source;
    }
    currentDepth++;
  }
  // 防止死循环
  if (seen.has(source)) {
    return source;
  }
  seen.add(source);

  for (const key in source) {
    traverse(source[key], depth, currentDepth, seen);
  }

  return source;
}

function reactiveGetter(source, deep) {
  let depth;
  // undefined true false number
  // undefined 不传deep默认遍历全部属性值
  if (isNumber(deep)) {
    depth = deep;
  } else {
    if (deep === false) {
      depth = 1;
    } else {
      depth = Infinity;
    }
  }
  return () => traverse(source, depth);
}

function doWatch(source, cb, { deep, immediate }) {
  // 产生一个可以给ReactiveEffect用的getter，需要对这个对象进行取值操作
  let getter = () => {};
  // source可能为 reactive对象、ref值、函数
  if (isReactive(source)) {
    getter = reactiveGetter(source, deep);
  } else if (isRef(source)) {
    getter = () => source.value;
  } else if (isFunction(source)) {
    getter = source;
  }
  
  let oldValue;
  // 第一次触发监听时设置的回调，第二次触发监听时触发
  let clean;
  // 在这里设置，每次触发监听都会设置
  const onCleanup = (fn) => {
    clean = () => {
      fn();
      clean = undefined;
    };
  };
  const job = () => {    
    if (clean) {
      clean();
    }
    // watch
    if (cb) {
      const newValue = effect.run();
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    } else {
      effect.run();
    }
  };
  // watchEffect
  if (!cb) {
    // 没有cb就是watchEffect，source就是其cb
    getter = () => { source(onCleanup); }
  }
  const effect = new ReactiveEffect(getter, job);
  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect.run();
    }
  } else {
    effect.run();
  }

  return () => effect.stop();
}