// 原生的(运行时才有watch)
// import {
//   reactive,
//   watch
// } from '/node_modules/vue/dist/vue.esm-browser.js';

// 自己的
import { reactive, ref, watch, watchEffect } from './reactivity.js';

const state = reactive({ name: '欧滋', age: 2010, address: { lion: 2 } });
// const Fangs = ref('While');

// watch(
//   Fangs,
//   (newValue, oldValue) => {
//     // 如果是引用类型，oldValue和newValue相等
//     console.log(newValue, oldValue);
//   },
//   {
//     deep: 2,
//     immediate: true
//   }
// );


// unwatch
// watchEffect 其实就是effect，不过一开始vue没有开放effect这个api
// const unwatch = watchEffect(() => {
//   app.innerHTML = `名字：${state.name} 年龄：${state.age}`;
// });

// unwatch();


// onCleanup
// 改变 -> job() -> if clean false -> cb() -> setTimeout -> onCleanup() -> clean=fn
// 第二次改变 -> job() -> if clean true -> fn()、clean=false -> cb() -> setTimeout -> onCleanup() -> clean=fn
// 每次执行watch的回调，onCleanup都会执行，但是onCleanup里面的回调，是在下一次watch触发时、watch回调执行前执行
// watch(
//   state,
//   (newValue, oldValue, onCleanup) => {
//     const timeoutID = setTimeout(() => {
//       console.log('setTimeout runner');
//     }, 3000);
//     onCleanup(() => {
//       clearTimeout(timeoutID);
//     });
//   }
// );

watchEffect((onCleanup) => {
  app.innerHTML = `姓名：${state.name} 年龄：${state.age}`
  const timeoutID = setTimeout(() => {
    console.log('setTimeout runner');
  }, 3000);
  onCleanup(() => {
    console.log('clean runner');
    clearTimeout(timeoutID);
  });
})


setTimeout(() => {
  state.name = 'Fourze';
  state.age = 2011;
  // state.address.lion = 1;
  // Fangs.value = 'Joker';
}, 1000);
