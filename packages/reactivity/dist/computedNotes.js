// 原生的
// import {
//   reactive,
//   effect,
//   ref,
//   toRef,
//   computed
// } from '/node_modules/@vue/reactivity/dist/reactivity.esm-browser.js';

// 自己的
import { reactive, effect, computed } from './reactivity.js';

const state = reactive({ name: '欧滋',age: 2010 });
const aliasName = computed(() => {
  console.log('runner');
  return 'Dinosaur ' + state.name;
})

// 充当template
effect(() => {
  console.log(aliasName.value);
  console.log(aliasName.value);
  console.log(aliasName.value);
});


setTimeout(() => {
  state.name = 'ooo';
}, 1000);

// 计算属性aliasName, 计算属性依赖的值name

// name与computedEffect关联 -> aliasName与templateEffect关联
// name改变 -> computedEffect.dirty=true -> computedEffect的scheduler -> templateEffect.scheduler


// 具体步骤历程：
// 调用computed函数，传入包含name的回调，创建一个计算属性内置的computedEffect，但是不执行run方法，computedEffect也就没name的dep关联

// 在effect(一般为template)使用aliasName后，执行templateEffect的run，templateEffect.dirty=false，activeEffect=templateEffect，执行包含aliasName的回调，触发aliasName的get方法；
// 执行computedEffect的run，activeEffect=computedEffect，computedEffect.dirty=false，执行包含name的回调，触发name的get方法，
// track把name的dep和computedEffect关联，name的get方法结束，computedEffect的run结束（假设computedEffect只有name一个关联值），activeEffect=templateEffect，
// track把aliasName的dep和templateEffect关联，aliasName的get方法结束，templateEffect的run结束（假设templateEffect只有aliasName一个计算属性），activeEffect=undefined

// if aliasName被使用多次，第一个aliasName的get方法结束后，触发第二个aliasName的get方法，此时computedEffect.dirty===false，（就算执行track，trackEffect方法也不会把aliasName的dep和templateEffect关联多次），第二个aliasName的get方法结束

// name改变后，触发name的set方法，执行trigger，computedEffect.dirty=true，根据name的dep关联的computedEffect，执行computedEffect.scheduler，
// 执行trigger，templateEffect.dirty=true，根据aliasName的dep关联的templateEffect，执行templateEffect.scheduler，重新执行templateEffect.run

