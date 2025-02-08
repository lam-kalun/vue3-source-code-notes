// 自己的
import { reactive, effect, ref, toRef, toRefs, proxyRefs } from './reactivity.js';
const flag = ref(true);

effect(() => {
  app.innerHTML = flag.value ? 'decade' : 'diend';
});

setTimeout(() => {
  flag.value = false;
}, 1000);




// proxy本质是对象，可以用来解构，但是解构后会失去响应式
// const state = ref({name: '欧兹', age: 2010});
// const {name, age} = state.value;
// console.log(state.value, name, age);




// toRef，不影响原proxy响应式
// const state = reactive({name: '欧兹', age: 2010});

// effect(() => {
//   app.innerHTML = state.name;
// });

// const name = toRef(state, 'name');

// setTimeout(() => {
//   name.value = 'Fourze';
// }, 1000);




// 论toRef里为什么不用Reflect
// const state = reactive({
//   name: "欧兹",
//   get aliasName() {
//     return this.name + "rider";
//   }
// });
// const aliasName = toRef(state, 'aliasName');
// // const name = toRef(state, 'name');

// effect(() => {
//   app.innerHTML = aliasName.value;
//   // app.innerHTML = state.aliasName;
// });

// setTimeout(() => {
//   name.value = 'Fourze';
//   // state.name = 'Fourze';
// }, 1000);




// toRefs，解构reactive
// const state = reactive({name: '欧兹', age: 2010});
// effect(() => {
//   app.innerHTML = `姓名：${state.name}、 年龄：${state.age}`;
// });
// const {name, age} = toRefs(state);
// setTimeout(() => {
//   name.value = 'Fourze';
//   age.value = 2011;
// }, 1000);




// proxyRefs
// const state = reactive({name: '欧兹', age: 2010});
// const proxy = proxyRefs({ ...toRefs(state) });

// proxy.name = 'decade'; // 不用proxyRefs，直接解构，就要proxy.name.value
// proxy.age = 2009;

// effect(() => {
//   app.innerHTML = `姓名：${proxy.name}、 年龄：${proxy.age}`;
// })




// proxyRefs，试验get、set为什么要使用Reflect
// const state = reactive({
//   name: 'Fourze',
//   get aliasName() {
//     return this.name + "rider";
//   },
//   set aliasName(newValue) {
//     this.name = newValue;
//     return true;
//   }
// });
// const aliasName = toRef(state, 'aliasName');

// const proxy = proxyRefs({
//   name: ref('kiva'),
//   // 直接aliasName，那aliasName就是一个ref，getter、setter里的this就是state2，
//   // proxyRefs里的Reflect无法改变this
//   aliasName,

//   // 这里可以改变this，this就是proxyRefs里的Reflect的receiver(proxy)
//   // get aliasName() {
//   //   return this.name + "rider";
//   // },
//   // set aliasName(newValue) {
//   //   this.name = newValue;
//   //   return true;
//   // }
// });

// proxy.aliasName = 'decade';

// effect(() => {
//   app.innerHTML = `姓名：${proxy.aliasName}`;
//   console.log(proxy, state);
// })




// const state = reactive({
//   name: '欧兹',
//   get aliasName() {
//     return this.name + "rider";
//   }
// });

// 单proxy可以用Reflect的receiver改变getter里的this，
// 但是{...toRef(reactive)}不一样，target[key]是一个ref，
// 用receiver无法改变reactive里getter里的this，
// 所以proxyRefs的html模版里，reactive里getter的this.xxx，指的是reactive().xxx，不是全局里的xxx

// const aliasName = toRef(state, 'aliasName');
// const state2 = { aliasName };
// app.innerHTML = Reflect.get(state, 'aliasName', {name: 'Fourze'});

// const flag = ref(true)
// 具体步骤历程（顺便试验证明dirty不会影响ref的逻辑）：
// 调用ref函数，传入一个值
// 在effect使用flag.value后，自动运行一遍effect.run，effect.dirty=false，activeEffect=effect，执行包含flag的回调，触发flag的get方法，track把flag的dep和effect关联起来，flag的get方法结束，effect.run结束
// flag.value改变后，触发flag的set方法，执行trigger，effect.dirty=true，根据flag的dep关联的effect，执行effect.run