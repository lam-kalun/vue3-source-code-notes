import { ShapeFlags } from "@vue/shared";
import { Fragment, isSameVNodeType, Text } from "./vnode";
import getSequence from "./seq";
import { reactive, ReactiveEffect } from '@vue/reactivity';

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
 
  const unmount = (vNode) => {
    // Fragment类型的vNode没有el，要一个个把它的children删除
    if (vNode.type === Fragment) {
      unmountChildren(vNode.children);
    } else {
      hostRemove(vNode.el);
    }
  };

  // 移除数组虚拟节点
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };

  // 递归挂载儿子(数组类型)元素
  const mountChildren = (children, container) => {
    // todo 暂时只考虑数组里面是h()
    // 如果是number或者string，就先让其变为虚拟节点，再patch
    // 所以如果children是数组，那么经过mountChildren()后，会变为vNode[]
    for (const item of children) {
      patch(null, item, container);
    }
  };

  // 挂载元素
  const mountElement = (vNode, container, anchor) => {
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
    
    hostInsert(el, container, anchor);
  };

  // 比较属性(直接处理对应的el元素)
  const patchProps = (oldProps, newProps, el) => {
    // 新属性全部采用
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }

    // 去掉剩余的旧属性
    for (const key in oldProps) {
      if (!newProps[key]) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };

  // 新旧children都是数组时，diff算法比较
  const patchKeyedChildren = (c1, c2, el) => {
    // 整理思路
    // 先从头开始比较后，改变和确认i，再从尾部开始比较后，改变和确认e1、e2

    // c1、c2开始的索引
    let i = 0;
    // c1结束的索引
    let e1 = c1.length - 1;
    // c2结束的索引
    let e2 = c2.length - 1;

    // 从头开始比较，相同的虚拟节点，直接渲染在元素节点上
    while (i <= e1 && i <= e2) {
      // todo c2[i] 不一定是vNode，要在这让其变为vNode
      if (isSameVNodeType(c1[i], c2[i])) {
        patch(c1[i], c2[i], el);
      } else {
        break;
      }
      i++
    }

    // 再从尾部开始比较，相同的虚拟节点，直接渲染在元素节点上
    while (i <= e1 && i <= e2) {
      // todo c2[e2] 不一定是vNode，要在这让其变为vNode
      if (isSameVNodeType(c1[e1], c2[e2])) {
        patch(c1[e1], c2[e2], el);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 旧的(e1)被新的(e2)从头部或尾部开始全部包含，且顺序都一样
    // (a b)
    // (a b) c
    // i = 2, e1 = 1, e2 = 2
    // (a b)
    // c (a b)
    // i = 0, e1 = -1, e2 = 0
    // (a c)
    // (a) b (c)
    // i = 1, e1 = 0, e2 = 1
    // e2括号外的，可以多加几位
    // 证明i被e1，或者e1被i，遍历完了
    if (i > e1) {
      // i没有遍历完e2，或者e2没有遍历完i，=证明i遍历到了e2的位置，或者e2遍历到了i的位置
      if (i <= e2) {
        // 根据e2后一位是否存在，判断是上面的哪一个例子
        const nextPos = e2 + 1;
        // c2[nextPos]已经在上面变为了vNode
        const anchor = c2[nextPos] === undefined ? null : c2[nextPos].el;
        while (i <= e2) {
          // todo c2[e2] 不一定是vNode，要在这让其变为vNode
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    }

    // 新的(e2)被旧的(e1)从头部或尾部开始全部包含，且顺序都一样
    // (a b) c
    // (a b)
    // i = 2, e1 = 2, e2 = 1
    // a (b c)
    // (b c)
    // i = 0, e1 = 0, e2 = -1
    // (a) b (c)
    // (a c)
    // i = 1, e1 = 1, e2 = 0
    // e1括号外的，可以多加几位
    else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i]);
        i++
      }
    }

    // 旧的(e1)和新的(e2)，除了头部和尾部，两方都还有不一样的
    // a b c
    // b
    // i = 0, e1 = 2, e2 = 0
    // (a b c) e f j d (h)
    // (a b c) d e f g k (h)
    // i = 3, e1 = 6, e2 = 7
    else {
      const s1 = i;
      const s2 = i;

      // d e f g k的映射表，把key和索引关联起来
      // 方便判断老的是否在新的里还有，没有就删除，有就更新
      const keyToNewIndexMap = new Map();

      // 排除前后相同项的数组个数
      const toBePatched = e2 - s2 + 1; // 7 - 3 + 1

      // 映射旧的children的数组下标+1，旧的有，新的没有，就为0
      const newIndexToOldMapIndex = new Array(toBePatched).fill(0);

      // 将新的vNode的key、index放入keyToNewIndexMap
      for (i = s2; i <= e2; i++) {
        // todo c2[e2] 不一定是vNode，要在这让其变为vNode
        const vNode = c2[i];
        if (vNode.key !== undefined) {
          keyToNewIndexMap.set(vNode.key, i);
        }
      }

      // 判断老的是否在新的里还有，没有就删除，有就更新页面元素和c2里vNode对应的el
      // 此时顺序还是旧的(c1)
      // 处理后元素显示为 a2 b2 c2 e2 f2 (j被删除) d2 h2
      // 为d2 e2 f2加上了el，处理后c2还有g、k没有el
      for(let i = s1; i <= e1; i++) {
        const vNode = c1[i];
        const newIndex = keyToNewIndexMap.get(vNode.key);
        if (newIndex == undefined) {
          unmount(vNode);
        } else {
          // 更新相同key的vNode
          // newIndexToOldMapIndex里为0的项，证明没有相同的，是新的children新增的
          newIndexToOldMapIndex[newIndex - s2] = i + 1;
          patch(vNode, c2[newIndex], el);
        }
      }

      // 更新顺序
      // 获取不需要移动的、在c1(旧的)有相同key的vNode，在新的children混乱的数组里的下标(不一定和新的children混乱的数组一样长， 一样长就啥都不用动了，只patchProps就行了)
      const increasingSeq = getSequence(newIndexToOldMapIndex);
      let j = increasingSeq.length - 1;
      // 先把旧的没有的更新到元素节点上，再使用insertBefore
      // 处理后元素显示为 a2 b2 c2 d2 e2 f2 g2(新增) k2(新增) h2
      // 倒序插入
      // 把要排序的变为一个数组，下标为i
      for(i = toBePatched - 1; i >= 0; i--) {
        // k2 g2 f2 e2 d2
        // [4, 3, 2, 1, 0]
        // k2的索引
        const newIndex = s2 + i;
        const newChild = c2[newIndex];
        // k2下一个元素，k2在最后就会没有
        const anchor = c2[newIndex + 1]?.el;
        // newChild有el说明旧的（c1）也有此虚拟节点，已经在上面更新了vNode对应的el
        // 只需要排序的虚拟节点
        // 使用newChild.el判断不一定准确，如果n2在其他地方挂载过，c2里的虚拟节点全部都会有el
        // 就算n2在其他地方挂载过，直接插入就好了
        if (newChild.el) {
          // diff算法优化
          if (i == increasingSeq[j]) {
            j--;
          } else {
            hostInsert(newChild.el, el, anchor);
          }
        }
        // newChild没有el说明旧的（c1）没有此虚拟节点，patch挂载上去
        else {
          patch(null, newChild, el, anchor);
        }
      }
    }
  };

  // 比较children(直接处理对应的el元素)
  const patchChildren = (n1, n2, el) => {
    // 只有n1、n2都是元素节点才走这里，所以shapeFlag是元素节点和children的节点或运算出来的
    // n1是旧的，n2是新的
    const c1 = n1.children; // 因为上一次mountChildren做过处理，c1必定是vNode[]
    const c2 = n2.children;

    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;

    // children一共有3种情况
    // 新的 旧的
    // 文本 数组
    // 文本 文本
    // 文本 null
    // 数组 数组
    // 数组 文本
    // 数组 null
    // null 数组
    // null 文本
    // null null(不做处理)

    // 新的是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 旧的就可能数组、文本、null
      // 如果旧的是数组要删除旧儿子
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }

      // 旧的是文本或者null，直接替换
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 新的是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // diff算法
        patchKeyedChildren(c1, c2, el);
      } else {
        hostSetElementText(el, '');
        mountChildren(c2, el);    
      }
    } else if (shapeFlag & ShapeFlags.ELEMENT) {
      // 新的是文本
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      } else {
        hostSetElementText(el, '');
      }
    }
  };

  // 比较相同元素节点的差异
  const patchElement = (n1, n2, container) => {
    // 复用dom元素
    const el = n2.el = n1.el;

    // 比较属性
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    // hostPatchProp 只能针对一个属性来处理
    patchProps(oldProps, newProps, el);
    n2.props = n1.props;

    patchChildren(n1, n2, el);
    n2.children = n1.children;
  };

  // 处理元素
  const processElement = (n1, n2, container, anchor) => {
    // 初始化
    if (n1 === null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2, container);
    }
  };

  // 处理文本
  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container, anchor);
    } else {
      if (n1.children !== n2.children) {
        const el = (n2.el = n1.el);
        hostSetText(el, n2.children);
      }
    }
  };

  // 处理Fragment
  const processFragment = (n1, n2, container, anchor) => {
    if (n1 == null) {
      // n2.children肯定是数组
      // 和processElement、processText相比，不会创建n2.type的节点，所以少了给n2.el赋值，Fragment的vNode没有el
      // 正常mountChildren的container入参是根据n2.type创建的节点，再把根据n2.type创建的节点放入render的container，这里直接是把children放入render的container
      mountChildren(n2.children, container);
    } else {
      patchChildren(n1, n2, container);
    }
  };

  // 比较组件
  const patchComponent = () => {};

  // 挂载组件
  const mountComponent = (n2, container, anchor) => {
    const { data = () => {}, render } = n2.type;
    const state = reactive(data());
    const instance = {
      state, // 状态(组件里的响应式data)
      vnode: n2, // 组件的虚拟节点
      subtree: null, // 子树
      isMounted: false, // 是否挂载完成
      update: null // 组件更新的函数
    };
    
    // 组件更新函数
    const componentUpdateFn = () => {
      // 基于状态更新组件
      // 第一次更新
      if (!instance.isMounted) {
        const subtree = render.call(state, state);
        patch(null, subtree, container, anchor);
        instance.isMounted = true;
        instance.subtree = subtree;
      } else {
        const subtree = render.call(state, state);
        patch(instance.subtree, subtree, container, anchor);
        instance.subtree = subtree;
      }
    };

    // 使用effect保证state改变后，重新执行渲染(componentUpdateFn)
    const effect = new ReactiveEffect(componentUpdateFn, () => { update() });

    const update = ( instance.update = () => { effect.run(); } )

    update();
  };

  // 处理组件
  // 组件会有两个虚拟节点，一个h(VueComponent)对象，一个组件里render返回的h()
  // html模版，最后也会解析成render函数返回的h()
  const processComponent = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor);
    } else {
      patchComponent();
    }
  };
 
  /*
    n1：旧vNode值
    n2：新vNode值
    container：装载的容器
    渲染走这里，更新也走这里
  */
  const patch = (n1, n2, container, anchor?) => {
    // 两次渲染同一个元素跳过即可
    if (n1 === n2) {
      return;
    };

    // n1、n2节点不相同
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1);
      n1 = null;
    }

    // 根据n2.type，处理不同的节点
    const { type } = n2;
    switch(type) {
      case Text:
        // 文本
        // 元素节点比较数组children的时候，会用到anchor
        processText(n1, n2, container, anchor);
        break;
      case Fragment:
        processFragment(n1, n2, container, anchor);
        break;
      default:
        // 元素
        if (type & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        }
        // 组件
        else if (type & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor);
        }
        break;
    }
    
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
    // 此时vNode的children如果是数组，经过patch -> patchElement -> mountElement -> mountChildren后
    // 会把children里的number和string变为type = Text的vNode
    // 所以container._vNode.children为vNode[]
    container._vNode = vNode;
  };

  return {
    render
  };
};