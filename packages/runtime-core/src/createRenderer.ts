import { ShapeFlags } from "@vue/shared";

export function createRenderer(renderOptions) {
  // 重命名
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp
  } = renderOptions;

  const mountChildren = (children, container) => {
    // todo暂时只考虑数组里面是h()
    for (const item of children) {
      patch(null, item, container);
    }
  };

  const mountElement = (vNode, container) => {
    const { type, props, children, shapeFlag } = vNode;
    // 创建元素
    const el = hostCreateElement(type);
    // 添加属性
    if (props) {
      for(const key in props) {
        hostPatchProp(el, key, null, props[key]);
       }
    }
    // 添加children
    // 利用与运算确认children
    // 原理：全部数值为1、2、4、5、16、32...时
    // 元素节点为1，children为文本时为8，此时h函数通过或运算得出shapeFlag为9
    // 这样可以在确定一个数时（元素节点），得出另一个数, 其他数会在与运算后变为0
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 递归渲染
      mountChildren(children, el);
    }
    
    hostInsert(el, container);
  };

  /*
    n1：旧vNode值
    n2：新vNode值
    container：装载的容器
    渲染走这里，更新也走这里
  */
  const patch = (n1, n2, container) => {
    // 两次渲染同一个元素跳过即可
    if (n1 === n2) {
      return;
    };
    // 初始化
    if (n1 === null) {
      mountElement(n2, container)
    }
  };

  /*
    vNode：虚拟节点
    container：装载的容器
    例子：render(vNode, app);
  */
  const render = (vNode, container) => {
    
    // 将虚拟节点变成真实的节点进行渲染
    patch(container._vNode || null, vNode, container);
    // 记录新值
    container._vNode = vNode;
  };

  return {
    render
  };
};