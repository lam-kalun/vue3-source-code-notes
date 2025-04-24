import { proxyRefs, reactive } from "@vue/reactivity";
import { hasOwn, isFunction, isObject, ShapeFlags } from "@vue/shared";
import { createVNode, Fragment } from "./vnode";

export function createComponentInstance(vNode) {
  const { props: propsOptions = {} } = vNode.type;
  // 组件实例(只有在初始patch vNode时才会创建)
  const instance = {
    data: null, // 状态(组件里的响应式data)
    vNode, // 组件的虚拟节点
    subtree: null, // 子树
    isMounted: false, // 是否挂载完成
    update: null, // 组件更新的函数
    props: {},
    attrs: {},
    slots: {},
    propsOptions, // 用户定义的props
    component: null,
    proxy: null, // 用来代理 data、props、attrs让用户使用更加方便
    render: null,
    next: null, // props、slot更新时，缓存的vNode
    setupState: null, // setup返回的对象
  };
  return instance;
};

const publicPrototype = {
  $attrs: instance => instance.attrs,
  $slots: instance => instance.slots,
  // ...
};

const handler = {
  get(target, key) {
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    }
    // 一些无法修改的属性，$slots、$attrs
    const getter = publicPrototype[key];
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, value) {
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (props && hasOwn(props, key)) {
      // 可以修改props中的嵌套属性（内部不报错），但是不合法
      console.warn("props are readonly");
      return false;
    } else if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value;
    }
    return true;
  }
}

// 初始化组件属性
const initProps = (instance, rawProps) => {
  const props = {};
  const attrs = {};
  // 用户在组件里自定义的
  const propsOptions = instance.propsOptions || {};

  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key];
      if (propsOptions[key]) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
    // todo 应该为shallowReactive
    // props不需要深度代理，组件不能改变props
    instance.props = reactive(props);
    instance.attrs = attrs;
  }
};

// 初始化组件插槽
const initSlots = (instance, children) => {
  const { slots } = instance;
  // h(VueComponent)如果有children，children一定是插槽
  if (instance.vNode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    // todo 函数、字符串、数组、vNode类型
    for (const key in children) {
      slots[key] = children[key];
    }
  } else if (children) {
    // default slots
    // todo 函数、字符串、数组类型
    if (Array.isArray(children)) {
      slots.default = () => createVNode(
        Fragment,
        null,
        children.slice(),
      )
    }
  }
};

export function setupComponent(instance) {
  const { vNode } = instance;
  // 根据propsOptions来区分出props和attrs
  // vNode.props全量的props，如果propsOptions有定义就放入instance.props
  // 赋值属性
  initProps(instance, vNode.props);
  // 赋值插槽
  initSlots(instance, vNode.children);
  // 赋值代理对象
  instance.proxy = new Proxy(instance, handler);
  let { data, render, setup } = vNode.type;
  if (setup) {
    const setupContext = {
      // emit,attrs,expose,slots
      slots: instance.slots
    };
    // todo shallowReadonly(instance.props) setup里面不可以更改props
    const setupResult = setup(instance.props, setupContext);
    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else if (isObject(setupResult)) {
      instance.setupState = proxyRefs(setupResult);
    } else {
      console.warn('setup() should return an function or object.');
    }
  }
  if (data) {
    if (!isFunction(data)) {
      console.warn("data option must be a function.");
      data = () => {};
    }
    // data中可以拿到props
    instance.data = reactive(data.call(instance.proxy));
  }
  if (!instance.render) {
    instance.render = render;
  }
};