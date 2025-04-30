import { hasOwn, ShapeFlags } from "@vue/shared";
import { Fragment, isSameVNodeType, normalizeVNode, Text } from "./vnode";
import getSequence from "./seq";
import { isRef, ReactiveEffect } from '@vue/reactivity';
import { queueJob } from "./scheduler";
import { createComponentInstance, setupComponent } from "./component";
import { invokeArray } from "./apiLifecycle";

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
    const { shapeFlag } = vNode;
    // Fragment类型的vNode没有el，要一个个把它的children删除
    if (vNode.type === Fragment) {
      unmountChildren(vNode.children);
    }
    // 组件类型的vNode没有el，实际渲染的vNode，是在vNode.component(实例instance).subtree，
    // el在vNode.component(实例instance).subtree里
    else if (shapeFlag & ShapeFlags.COMPONENT) {
      // subtree有可能还是Fragment、COMPONENT等其他类型
      unmount(vNode.component.subtree);
    }
    else {
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
  const mountChildren = (children, container, anchor, parentComponent) => {
    // 如果是number或者string，就先让其变为虚拟节点，再patch
    // 所以如果children是数组，那么经过mountChildren()后，会变为vNode[]
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]));
      patch(null, child, container, anchor, parentComponent);
    }
  };

  // 挂载元素
  const mountElement = (vNode, container, anchor, parentComponent) => {
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
      mountChildren(children, el, null, parentComponent);
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
  const patchKeyedChildren = (c1, c2, el, anchor, parentComponent) => {
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
      const n1 = c1[i];
      const n2 = normalizeVNode(c2[i]);
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el, anchor, parentComponent);
      } else {
        break;
      }
      i++
    }

    // 再从尾部开始比较，相同的虚拟节点，直接渲染在元素节点上
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = normalizeVNode(c2[e2]);
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el, anchor, parentComponent);
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
          patch(null, normalizeVNode(c2[i]), el, anchor, parentComponent);
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
        const vNode = normalizeVNode(c2[i]);
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
          patch(vNode, c2[newIndex], el, anchor, parentComponent);
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
          patch(null, newChild, el, anchor, parentComponent);
        }
      }
    }
  };

  // 比较children(直接处理对应的el元素)
  const patchChildren = (n1, n2, el, anchor, parentComponent) => {
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
        patchKeyedChildren(c1, c2, el, anchor, parentComponent);
      } else {
        hostSetElementText(el, '');
        mountChildren(c2, el, null, parentComponent);    
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
  const patchElement = (n1, n2, parentComponent) => {
    // 复用dom元素
    const el = n2.el = n1.el;

    // 比较属性
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    // hostPatchProp 只能针对一个属性来处理
    patchProps(oldProps, newProps, el);
    n2.props = n1.props;

    patchChildren(n1, n2, el, null, parentComponent);
    n2.children = n1.children;
  };

  // 处理元素
  const processElement = (n1, n2, container, anchor, parentComponent) => {
    // 初始化
    if (n1 === null) {
      mountElement(n2, container, anchor, parentComponent);
    } else {
      patchElement(n1, n2, parentComponent);
    }
  };

  // 处理文本
  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container, anchor);
    } else {
      // 不管children一样不一样，都要复用el
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children);
      }
    }
  };

  // 处理Fragment
  const processFragment = (n1, n2, container, anchor, parentComponent) => {
    if (n1 == null) {
      // n2.children肯定是数组
      // 和processElement、processText相比，不会创建n2.type的节点，所以少了给n2.el赋值，Fragment的vNode没有el
      // 正常mountChildren的container入参是根据n2.type创建的节点，再把根据n2.type创建的节点放入render的container，这里直接是把children放入render的container
      mountChildren(n2.children, container, null, parentComponent);
    } else {
      patchChildren(n1, n2, container, null, parentComponent);
    }
  };

  // 判断组件属性是否变了
  const hasPropsChanged = (prevProps, nextProps) => {
    if (!prevProps) {
      return !!nextProps
    }
    if (!nextProps) {
      return true
    }
    const nKeys = Object.keys(nextProps);
    // 长度不一样肯定变了
    if (nKeys.length !== Object.keys(prevProps).length) {
      return true;
    }
    for (let key of nKeys) {
      if (nextProps[key] !== prevProps[key]) {
        return true;
      }
    }
    return false;
  };

  // 比较组件属性
  const updateProps = (instance, prevProps, nextProps) => {
    // 源码里有用propsOptions区分更新instance.attrs和instance.props
    const { propsOptions } = instance;

    if (hasPropsChanged(prevProps, nextProps)) {
      // 老思路
      // 赋值新的，去掉老的
      for (let key in nextProps) {
        if (propsOptions[key]) {
          instance.props[key] = nextProps[key];
        } else {
          instance.attrs[key] = nextProps[key];
        }
      }

      for (let key in prevProps) {
        if (!hasOwn(nextProps, key)) {
          delete instance.props[key];
          delete instance.attrs[key];
        }
      }
    }
  };

  // 判断是否有插槽、属性是否有变化，如果有就更新组件
  const shouldComponentUpdate = (n1, n2) => {
    const { props: prevProps, children: prevChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;

    // 有插槽就需要更新
    if (prevChildren || nextChildren) return true;

    if (prevProps === nextProps) return false;

    if (!prevProps) {
      return !!nextProps
    }
    if (!nextProps) {
      return true
    }

    return hasPropsChanged(prevProps, nextProps);
  };

  // 比较组件
  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component);

    if (shouldComponentUpdate(n1, n2)) {
      instance.next = n2; // 如果调用update时，有next属性，说明属性or插槽也有更新
      // 不会同时多次触发，详情看componentUpdateFn
      instance.update(); // 把属性、插槽更新逻辑，统一放在effect的fn里
    }

    // vue2的老方法
    // const { props: prevProps } = n1;
    // const { props: nextProps } = n2;

    // updateProps(instance, prevProps, nextProps);
  };

  // 根据n2更新组件实例
  const updateComponentPreRender = (instance, next) => {
    instance.next = null;
    const { props: prevProps } = instance.vNode;
    const { props: nextProps } = next;
    instance.vNode = next;
    // 此时effect的run在执行中，reactive里set的triggerEffects判断后，不会触发effect.scheduler了
    updateProps(instance, prevProps, nextProps);
  };

  const setupRenderEffect = (instance, container, anchor) => {
    const { render } = instance;
    // 组件更新函数
    const componentUpdateFn = () => {
      // 基于状态(data, props, slot)更新组件
      // 第一次更新
      if (!instance.isMounted) {
        const { bm, m } = instance;
        if (bm) {
          invokeArray(bm);
        }
        const subtree = render.call(instance.proxy, instance.proxy);
        patch(null, subtree, container, anchor, instance);
        instance.isMounted = true;
        instance.subtree = subtree;
        if (m) {
          invokeArray(m);
        }
      } else {
        // 有next属性，说明属性or插槽也有更新
        // 先更新组件实例里的属性or插槽
        const { next, bu, u } = instance;
        if (bu) {
          invokeArray(bu);
        }
        if (next) {
          updateComponentPreRender(instance, next);
        }
        // 改变data会直接修改instance里的data，但是如果改变外部传入的props、slot，instance里的自定义的props和attrs不会改变，所以render.call可以获取data改变后的vNode，但是不能获取外部传入的props、slot改变后的vNode，需要手动更新instance
        const subtree = render.call(instance.proxy, instance.proxy);
        patch(instance.subtree, subtree, container, anchor, instance);
        instance.subtree = subtree;
        if (u) {
          invokeArray(u);
        }
      }
    };

    // 使用effect保证state改变后，重新执行渲染(componentUpdateFn)
    // 同时改变多个状态时（data、props、slot），会触发多次set-trigger-scheduler，
    // 而且每次会走完effect再触发下一次set（effect._running不会起作用），所以要用queueJob进行延迟更新操作
    const effect = new ReactiveEffect( componentUpdateFn, () => { queueJob(update) } );

    // 把effect.run赋值给instance.update，为什么使用instance.update时不需要用queueJob包裹
    // 因为instance.update是在patch-processComponent-updateComponent里触发，而且修改多个props，也只会调用一次instance.update
    // 只要保证set-trigger-scheduler只触发一次componentUpdateFn-patch，就不需要使用queueJob
    const update = ( instance.update = () => effect.run() );

    update();
  };

  // 挂载组件
  const mountComponent = (vNode, container, anchor, parentComponent) => {
    // 1、创建组件实例
    // 元素更新 n2.el = n1.el
    // 组件更新 n2.component.subtree.el = n1.component.subtree.el
    const instance = (vNode.component = createComponentInstance(vNode, parentComponent));

    // 2、给实例的属性赋值
    setupComponent(instance);
    
    // 3、创建一个effect
    setupRenderEffect(instance, container, anchor);
  };

  // 处理组件
  // 组件会有两个虚拟节点，一个h(VueComponent)对象，一个组件里render返回的h()
  // html模版，最后也会解析成render函数返回的h()
  const processComponent = (n1, n2, container, anchor, parentComponent) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor, parentComponent);
    } else {
      updateComponent(n1, n2);
    }
  };

  const setRef = (rawRef, vNode) => {
    // 如果ref放到组件上，指代的是组件实例；如果组件上有用expose方法设置exposed，指代的是exposed；
    // 如果ref放到dom元素上，指代的是dom元素
    const value = vNode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT ? vNode.component.exposed || vNode.component.proxy : vNode.el;
    if (isRef(rawRef)) {
      rawRef.value = value;
    }
  };
 
  /*
    n1：旧vNode值
    n2：新vNode值
    container：装载的容器
    渲染走这里，更新也走这里
  */
  const patch = (n1, n2, container, anchor?, parentComponent?) => {
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
    const { type, shapeFlag, ref } = n2;
    switch(type) {
      case Text:
        // 文本
        // 元素节点比较数组children的时候，会用到anchor
        processText(n1, n2, container, anchor);
        break;
      case Fragment:
        processFragment(n1, n2, container, anchor, parentComponent);
        break;
      default:
        // 元素
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parentComponent);
        }
        // 组件
        else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor, parentComponent);
        }
        break;
    }
    
    if (ref != null) {
      setRef(ref, n2);
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