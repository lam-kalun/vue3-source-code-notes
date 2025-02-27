import { isObject } from '@vue/shared';
import { createVNode, isVNode } from './createVNode';

export function h(type, propsOrChildren?, children?) {
  const l = arguments.length;
  // 1 元素
  // 2 元素+属性 元素+文本 元素+数组 元素+虚拟对象
  // 3 元素+属性+文本 元素+属性+数组 元素+属性+虚拟对象
  // 4+ 元素+属性+文本+文本 元素+属性+虚拟对象+虚拟对象（两个处理方法一样）
  
  // 1、2.1、3.1、3.2可以正常调用createVNode
  // 如果儿子是虚拟对象，就变为数组
  if (l === 2) {
    // 2.4
    if (isVNode(propsOrChildren)) {
      return createVNode(type, null, [propsOrChildren]);
    }
    // 2.2、2.3
    if (!isObject(propsOrChildren)) {
      return createVNode(type, null, propsOrChildren);
    }
  } else if (l === 3) {
    // 3.3
    if (isVNode(children)) {
      return createVNode(type, propsOrChildren, [children]);
    }
  } else if (l > 3) {
    // 4.1 4.2
    return createVNode(type, propsOrChildren, Array.from(arguments).slice(2));
  }
  // 1、2.1、3.1、3.2
  return createVNode(type, propsOrChildren, children);
};