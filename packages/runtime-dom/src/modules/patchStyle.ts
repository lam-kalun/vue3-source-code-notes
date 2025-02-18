export default function patchStyle(el, prevValue, nextValue) {
  const style = el.style;
  for (const key in nextValue) {
    // 新样式全部生效
    style[key] = nextValue[key];
  }

  if (prevValue) {
    for (const key in prevValue) {
      // 判断以前的属性现在有没有，没有就删除el.style上的属性
      if (nextValue[key] == null) {
        style[key] = null;
      }
    }
  }
};