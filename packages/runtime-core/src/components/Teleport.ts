import { ShapeFlags } from "@vue/shared";

export const Teleport = {
  name: 'Teleport',
  __isTeleport: true,
  process(n1, n2, container, anchor, parentComponent, internals) {
    const {
      m: move,
      mc: mountChildren,
      pc: patchChildren
    } = internals;
    if (n1 == null) {
      const target = (n2.target = document.querySelector(n2.props.to));
      if (target) {
        mountChildren(n2.children, target, anchor, parentComponent);
      }
    } else {
      patchChildren(n1, n2, n2.target, anchor, parentComponent);
      if ((n2.props && n2.props.to) !== (n1.props && n1.props.to)) {
        const nextTarget = (n2.target = document.querySelector(n2.props.to));
        // todo 兼容children不是数组的情况
        // 源码没有在这里遍历children，直接调用move函数，在move函数里按children类型移动，如果是children数组类型，就遍历children调用move
        if (n2.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          for(let child of n2.children) {
            move(child, nextTarget, anchor);
          }
        }
      }
    }
  },
  remove(vNode, internals) {
    const { children, shapeFlag } = vNode;
    const { um: unmount } = internals;
    // todo 兼容children不是数组的情况
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      for(let child of children) {
        unmount(child);
      }
    }
  }
};