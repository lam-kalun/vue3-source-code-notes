import { isObject, isString, ShapeFlags } from "@vue/shared";

export const Text = Symbol.for('Text');
export const Fragment = Symbol.for('Fragment');

export function createVNode(type, props, children?, patchFlag = 0, isBlockNode = false,) {
  // 元素节点1 组件节点4 其他节点0
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isTeleport(type)
    ? ShapeFlags.TELEPORT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;

  const vNode = {
    __v_isVNode: true,
    type,
    props,
    children,
    shapeFlag,
    el: null,
    key: props?.key || null,
    ref: props?.ref || null,
    patchFlag,
    dynamicChildren: null,
  };

  // 动态属性可以从patchFlag值判断
  // 动态children从dynamicChildren判断
  if (
    currentBlock &&
    // 避免区块节点追踪自身
    !isBlockNode && 
    patchFlag > 0
  ) {
    currentBlock.push(vNode);
  }

  // 如果有children，再通过或运算计算一下shapeFlag, 以便在渲染时，判断出是数组还是字符串文本
  if (children) {
    // children只能是数组或者字符串文本
    // children是虚拟节点，也会被嵌套在数组内
    if (Array.isArray(children)) {
      vNode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else if (isObject(children)) {
      vNode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
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

export function isTeleport(value) {
  return value ? value.__isTeleport === true : false;
};

export function normalizeVNode(child) {
  if (Array.isArray(child)) {
    return createVNode(Fragment, null, child.slice());
  } else if (isVNode(child)) {
    return child;
  } else if (typeof child === 'string' || typeof child === 'number') {
    return createVNode(Text, null, String(child));
  }
};

// 用于收集动态节点
// 比如root节点render时先调用openBlock，children里调用createElementVNode时，有patchFlag的vNode，就push进currentBlock
let currentBlock = null;
export function openBlock() {
  currentBlock = [];
};
export function closeBlock() {
  currentBlock = null;
};
export function setupBlock(vNode) {
  vNode.dynamicChildren = currentBlock;
  closeBlock();
  return vNode;
};

export function createElementBlock(type, props, children?, patchFlag?) {
  return setupBlock(createVNode(type, props, children, patchFlag, true));
};
export { createVNode as createElementVNode };