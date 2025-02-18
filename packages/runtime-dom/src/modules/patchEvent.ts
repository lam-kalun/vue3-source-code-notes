function createInvoker(value) {
  const invoker = (e) => { invoker.value(e); };
  // 更改invoker中的value，就可以修改对应的调用函数
  invoker.value = value;
  return invoker;
};

const veiKey = Symbol('_vei');
export default function patchEvent(el, name, nextValue) {
  // 创建一个对象，根据name缓存事件
  const invokers = el[veiKey] || (el[veiKey] = {});
  const eventName = name.slice(2).toLowerCase();
  // 取出name的缓存（有的话，是一个函数）
  const existingInvoker = invokers[name];

  // 第一次没有缓存，相当于为eventName绑定一个() => {fn1}
  // 第二次有缓存，改变eventName绑定的函数，变为() => {fn2}
  // 这样就不用重新解绑了（一个元素节点可以绑定多个eventName事件）
  if (existingInvoker) {
    if (nextValue) {
      existingInvoker.value = nextValue;
    } else {
      el.removeEventListener(eventName);
      invokers[name] = void 0;
    }
  } else {
    if (nextValue) {
      const invoker = invokers[name] = createInvoker(nextValue);
      el.addEventListener(eventName, invoker);
    }
  }
};