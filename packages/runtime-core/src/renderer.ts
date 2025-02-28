import { ShapeFlags } from "@vue/shared";
import { isSameVNodeType } from "./vnode";

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

  // 移除节点
  const unmount = (vNode) => {
    hostRemove(vNode.el);
  };

  // 挂载元素
  const mountElement = (vNode, container) => {
    const { type, props, children, shapeFlag } = vNode;
    // 创建元素
    const el = vNode.el = hostCreateElement(type);
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

  // 递归挂载儿子元素
  const mountChildren = (children, container) => {
    // todo暂时只考虑数组里面是h()
    for (const item of children) {
      patch(null, item, container);
    }
  };

  // 比较属性(直接处理对应的el元素)
  const patchProps = (oldProps, newProps, el) => {
    // 新属性全部采用
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }

    // 去掉未剩余的旧属性
    for (const key in oldProps) {
      if (!newProps[key]) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };

  // 比较元素节点的差异，肯定要复用元素
  const patchElement = (n1, n2, container) => {
    // 复用dom元素
    const el = n2.el = n1.el;

    // 比较属性
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    // hostPatchProp 只能针对一个属性来处理
    patchProps(oldProps, newProps, el);
    n2.props = n1.props;

    // todo比较children

  };

  // 处理元素
  const processElement = (n1, n2, container) => {
    // 初始化
    if (n1 === null) {
      mountElement(n2, container);
    } else {
      patchElement(n1, n2, container);
    }
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

    // n1、n2节点不相同
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1);
      n1 = null;
    }

    // 根据n1.shapeFlag得出1.type，然后处理不同type
    // 元素
    processElement(n1, n2, container);
    // todo组件
  };

  /*
    vNode：虚拟节点
    container：装载的容器
    例子：render(vNode, app);
  */
  const render = (vNode, container) => {
    // 多次调用render，会进行虚拟节点比较，再进行更新
    // vNode改变后，如果vNode空了，就直接删除虚拟节点对应的元素节点，不比较了
    if (vNode == null) {
      // 如果vNode先渲染，container后渲染，这时就没有container._vNode
      if (container._vNode) {
        unmount(container._vNode);
      }
    } else {
      // 将虚拟节点变成真实的节点进行渲染
      patch(container._vNode || null, vNode, container);
    }
    // 记录新值
    container._vNode = vNode;
  };

  return {
    render
  };
};