import { reactive } from "@vue/reactivity";
import { hasOwn, isFunction } from "@vue/shared";

export function createComponentInstance(vNode) {
  const { props: propsOptions = {} } = vNode.type;
  const instance = {
    data: null, // 状态(组件里的响应式data)
    vNode, // 组件的虚拟节点
    subtree: null, // 子树
    isMounted: false, // 是否挂载完成
    update: null, // 组件更新的函数
    props: {},
    attrs: {},
    propsOptions, // 用户定义的props
    component: null,
    proxy: null, // 用来代理 data、props、attrs让用户使用更加方便
    render: null,
  };
  return instance;
};

const publicPrototype = {
  $attrs: instance => instance.attrs,
};

const handler = {
  get(target, key) {
    const { data, props } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    }
    // 一些无法修改的属性，$slots、$attrs
    const getter = publicPrototype[key];
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, value) {
    const { data, props } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (props && hasOwn(props, key)) {
      // 可以修改props中的嵌套属性（内部不报错），但是不合法
      console.warn("props are readonly");
      return false;
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

export function setupComponent(instance) {
  const { vNode } = instance;
  // 根据propsOptions来区分出props和attrs
  // vNode.props全量的props，如果propsOptions有定义就放入instance.props
  // 赋值属性
  initProps(instance, vNode.props);
  // 赋值代理对象
  instance.proxy = new Proxy(instance, handler);
  const { data, render } = vNode.type;
  if (!isFunction(data)) {
    return console.warn("data option must be a function");
  }
  // data中可以拿到props
  instance.data = reactive(data.call(instance.proxy));
  instance.render = render;
};