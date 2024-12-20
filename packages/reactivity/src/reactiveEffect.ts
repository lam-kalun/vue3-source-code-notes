import { activeEffect, trackEffect } from './effect'

const targetMap = new WeakMap()

function createDep(cleanup) {
  let dep = new Map() as any;
  dep.cleanup = cleanup;
  return dep;
}

export function track(target, key) {
  // 因为effect实例的run方法结束后，activeEffect为undefined
  // 有activeEffect这个属性，说明这个key是在effect里访问的，没有说明在effect外访问
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = new Map());
    }

    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = createDep(() => {depsMap.delete(key)}));
    }
    
    // 将当前的effect放入到dep(影射表)中，后续可以根据值的变化触发此dep中存放的effect
    trackEffect(activeEffect, dep);
    console.log(targetMap, activeEffect);
  }
}

// todo 整理格式
// {
//   {name: '欧兹', age: 2010}: {
//     name: {
//       effect
//     },
//     age: {
//       effect
//     }
//   }
// }