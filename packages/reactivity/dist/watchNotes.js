// 原生的(运行时才有watch)
// import {
//   reactive,
//   watch
// } from '/node_modules/vue/dist/vue.esm-browser.js';

// 自己的
import { reactive, ref, watch, watchEffect } from './reactivity.js';

const state = reactive({ name: '欧滋', age: 2010, address: { lion: 2 } });
const Fangs = ref('While');

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

// 其实就是effect，不过一开始vue没有开放effect这个api
const unwatch = watchEffect(() => {
  app.innerHTML = `名字：${state.name} 年龄：${state.age}`;
});

unwatch();

setTimeout(() => {
  state.name = 'Fource';
  state.age = 2011;
  // state.address.lion = 1;
  // Fangs.value = 'Joker';
}, 1000);
