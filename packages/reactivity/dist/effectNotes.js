// 原生的
// import {
//   reactive,
//   effect
// } from '/node_modules/@vue/reactivity/dist/reactivity.esm-browser.js';

// 自己的
import { reactive, effect } from './reactivity.js';

const obj = { name: '欧兹', age: 2010, flag: true, address: { n: 1 } };
const state = reactive(obj);

// 修改一个属性后，先触发set触发effect.run，再触发get收集映射，代码再往下走（如修改另一个属性）
effect(() => {
  app.innerHTML = `姓名：${state.name}、 年龄：${state.age}`;
});

effect(() => {
  app.innerHTML = `姓名：${state.name}`;
});

setTimeout(() => {
  state.name = 'Fourze';
  state.age++; // 数据变化后，effect重新执行
}, 1000);




// 初始effect.run，先触发get重新收集flag、name的映射
// flag修改后，触发set触发effect.run，再触发get重新收集flag、age的映射，然后再修改name时，就不会触发effect了
// effect(() => {
//   app.innerHTML = state.flag ? state.name : state.age;
//   console.log('runner');
// });

// setTimeout(() => {
//   state.flag = false;
//   console.log('修改属性后，不应该触发effect');
//   state.name = 'Fourze';
// }, 1000);




// effect自定义调度
// const runner = effect(
//   () => {
//     app.innerHTML = `姓名：${state.name}、 年龄：${state.age}`;
//   },
//   {
//     scheduler: () => {
//       console.log('数据更新了，不重新渲染，走自己的逻辑');
//       runner();
//     }
//   }
// );

// setTimeout(() => {
//   state.name = 'Fourze';
//   state.age++; // 数据变化后，effect重新执行
// }, 1000);




// 嵌套循环
// effect(() => {
//   app.innerHTML = `姓名：${state.name}`;
//   state.name = Math.random()
// });




// 递归代理，和用到其属性的effect关联
// effect(() => {
//   app.innerHTML = state.address.n;
// })
// setTimeout(() => {
//   state.address.n = 2;
// }, 1000);