export default function patchStyle(el, prevValue, nextValue) {
  const style = el.style;
  for (const key in nextValue) {
    // 新样式全部生效
    style[key] = nextValue[key];
  }
  // 初始化时prevValue为空
  if (prevValue) {
    // 节点比较时，前一次有style属性，后一次没有style属性时，去掉剩余的旧属性时，nextValue会传入为空
    if (nextValue) {
      for (const key in prevValue) {
        // 判断以前的属性现在有没有，没有就删除el.style上的属性
        if (nextValue[key] == null) {
          style[key] = null;
        }
      }
    } else {
      el.removeAttribute('style');
    }
  }
};