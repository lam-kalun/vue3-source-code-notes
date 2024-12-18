import { activeEffect } from './effect'

export function track(target, key) {
  // 因为effect实例的run方法结束后，activeEffect为undefined
  // 有activeEffect这个属性，说明这个key是在effect里访问的，没有说明在effect外访问
  // if (activeEffect) {
    console.log(activeEffect, key);
  // }
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