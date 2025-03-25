import { isObject, isString, ShapeFlags } from "@vue/shared";

export function createVNode(type, props, children?) {
  // 元素节点1 文本节点0
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    ? isObject(type)
    : ShapeFlags.STATEFUL_COMPONENT
    : 0;

  const vNode = {
    __v_isVNode: true,
    type,
    props,
    children,
    shapeFlag,
    el: null,
    key: props?.key
  };

  // 如果有children，再通过或运算计算一下shapeFlag, 以便在渲染时，判断出是数组还是字符串文本
  if (children) {
    // children只能是数组或者字符串文本
    // children是虚拟节点，也会被嵌套在数组内
    if (Array.isArray(children)) {
      vNode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else {
      vNode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
      vNode.children = String(children);
    }
  }

  return vNode;
};

export const isVNode = (value) => {
  return value ? value.__v_isVNode === true : false;
};

export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
};

export const Text = Symbol('Text');

export const Fragment = Symbol('Fragment');