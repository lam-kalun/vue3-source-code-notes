import { isString, ShapeFlags } from "@vue/shared";

export function createVNode(type, props, children?) {
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;

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