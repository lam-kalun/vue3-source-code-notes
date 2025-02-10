// 原生的(运行时才有watch)
// import {
//   reactive,
//   watch
// } from '/node_modules/vue/dist/vue.esm-browser.js';

// 自己的
import { reactive, watch } from './reactivity.js';

const state = reactive({ name: '欧滋', age: 2010, address: { lion: 2 } });

watch(
  state,
  (oldValue, newValue) => {
    // 如果是引用类型，oldValue和newValue相等
    console.log(oldValue, newValue);
  },
  {
    deep: 2
  }
);

setTimeout(() => {
  // state.name = 'Fource';
  state.address.lion = 1;
}, 1000);