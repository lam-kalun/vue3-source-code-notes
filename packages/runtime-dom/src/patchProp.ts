// 主要对元素节点的属性进行操作
// class style event 普通属性

import patchClass from './modules/patchClass';
import patchStyle from './modules/patchStyle';
import patchEvent from './modules/patchEvent';
import patchAttr from './modules/patchAttr';

export default function patchProp(el, key, prevValue, nextValue) {
  if (key === 'class') {
    patchClass(el, nextValue);
  } else if (key === 'style') {
    patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    patchEvent(el, key, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
}