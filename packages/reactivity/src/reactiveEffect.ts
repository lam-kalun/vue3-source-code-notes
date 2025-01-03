import { activeEffect, trackEffect, triggerEffects } from './effect';

const targetMap = new WeakMap();

export function createDep(cleanup) {
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
    // console.log(targetMap);
  }
}

export function trigger(target, key, value, oldValue) {
  const depsMap = targetMap.get(target)
  // 对象没有出现在effect上
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  // 对象该属性没有出现在effect上
  if (!dep) {
    return;
  }

  // 修改属性对应effect
  triggerEffects(dep);
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

// depsMap: 
//  {
//     name: {
//       effect
//     },
//     age: {
//       effect
//     }
//   }

// dep: 
//  {
//    effect
//  }