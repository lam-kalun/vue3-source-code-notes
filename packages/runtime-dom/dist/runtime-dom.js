// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  // 将节点插入到parent节点里，anchor节点前（可不传）
  insert: (node, parent, anchor) => {
    parent.insertBefore(node, anchor || null);
  },
  // 移除节点
  remove: (node) => {
    const parent = node.parentNode;
    if (parent) {
      parent.removeChild(node);
    }
  },
  // 创建元素节点
  createElement: (type) => document.createElement(type),
  // 创建文本节点
  // 可传入文本类型数组
  createText: (text) => document.createTextNode(text),
  // 设置节点的值
  // 如果要设置元素节点的文本，因为文本始终位于文本节点内，所以必须返回文本节点的节点值：el.childNodes[0].nodeValue
  setText: (node, text) => {
    node.nodeValue = text;
  },
  // 设置元素节点的文本内容，或者所有后代
  setElementText: (el, text) => {
    el.textContent = text;
  },
  // 返回父节点
  parentNode: (node) => node.parentNode,
  // 返回同一树级别上的下一个节点
  nextSibling: (node) => node.nextSibling
};

// packages/runtime-dom/src/modules/patchClass.ts
function patchClass(el, value) {
  if (value == null) {
    el.removeAttribute("class");
  } else {
    el.className = value;
  }
}

// packages/runtime-dom/src/modules/patchStyle.ts
function patchStyle(el, prevValue, nextValue) {
  const style = el.style;
  for (const key in nextValue) {
    style[key] = nextValue[key];
  }
  if (prevValue) {
    if (nextValue) {
      for (const key in prevValue) {
        if (nextValue[key] == null) {
          style[key] = null;
        }
      }
    } else {
      el.removeAttribute("style");
    }
  }
}

// packages/runtime-dom/src/modules/patchEvent.ts
function createInvoker(value) {
  const invoker = (e) => {
    invoker.value(e);
  };
  invoker.value = value;
  return invoker;
}
var veiKey = Symbol("_vei");
function patchEvent(el, name, nextValue) {
  const invokers = el[veiKey] || (el[veiKey] = {});
  const eventName = name.slice(2).toLowerCase();
  const existingInvoker = invokers[name];
  if (existingInvoker) {
    if (nextValue) {
      existingInvoker.value = nextValue;
    } else {
      el.removeEventListener(eventName);
      invokers[name] = void 0;
    }
  } else {
    if (nextValue) {
      const invoker = invokers[name] = createInvoker(nextValue);
      el.addEventListener(eventName, invoker);
    }
  }
}

// packages/runtime-dom/src/modules/patchAttr.ts
function patchAttr(el, key, value) {
  if (value == null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}

// packages/runtime-dom/src/patchProp.ts
function patchProp(el, key, prevValue, nextValue) {
  if (key === "class") {
    patchClass(el, nextValue);
  } else if (key === "style") {
    patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    patchEvent(el, key, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
}

// packages/shared/src/index.ts
var isObject = (value) => {
  return typeof value === "object" && value !== null;
};
var isFunction = (value) => {
  return typeof value === "function";
};
var isNumber = (value) => {
  return typeof value === "number";
};
var isString = (value) => {
  return typeof value === "string";
};
var hasOwnProperty = Object.prototype.hasOwnProperty;
var hasOwn = (val, key) => hasOwnProperty.call(val, key);

// packages/runtime-core/src/vnode.ts
var Text = Symbol.for("Text");
var Fragment = Symbol.for("Fragment");
function createVNode(type, props, children) {
  const shapeFlag = isString(type) ? 1 /* ELEMENT */ : isTeleport(type) ? 64 /* TELEPORT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
  const vNode = {
    __v_isVNode: true,
    type,
    props,
    children,
    shapeFlag,
    el: null,
    key: props?.key || null,
    ref: props?.ref || null
  };
  if (children) {
    if (Array.isArray(children)) {
      vNode.shapeFlag |= 16 /* ARRAY_CHILDREN */;
    } else if (isObject(children)) {
      vNode.shapeFlag |= 32 /* SLOTS_CHILDREN */;
    } else {
      vNode.shapeFlag |= 8 /* TEXT_CHILDREN */;
      vNode.children = String(children);
    }
  }
  return vNode;
}
var isVNode = (value) => {
  return value ? value.__v_isVNode === true : false;
};
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
function isTeleport(value) {
  return value ? value.__isTeleport === true : false;
}
function normalizeVNode(child) {
  if (Array.isArray(child)) {
    return createVNode(Fragment, null, child.slice());
  } else if (isVNode(child)) {
    return child;
  } else if (typeof child === "string" || typeof child === "number") {
    return createVNode(Text, null, String(child));
  }
}

// packages/runtime-core/src/seq.ts
function getSequence(arr) {
  const result = [0];
  const p = result.slice(0);
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      const resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        p.push(result[result.length - 1]);
        result.push(i);
        continue;
      }
      let start = 0;
      let end = result.length - 1;
      let middle;
      while (start < end) {
        middle = (start + end) / 2 | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      if (arrI < arr[result[start]]) {
        p[i] = result[start - 1];
        result[start] = i;
      }
      let l = result.length;
      let last = result[l - 1];
      while (l-- > 0) {
        result[l] = last;
        last = p[last];
      }
    }
  }
  return result;
}

// packages/reactivity/src/effect.ts
function effect(fn, options) {
  const _effect = new ReactiveEffect(
    fn,
    () => {
      _effect.run();
    }
  );
  _effect.run();
  if (options) {
    Object.assign(_effect, options);
  }
  const runner = _effect.run.bind(_effect);
  return runner;
}
var activeEffect;
function preCleanEffect(effect2) {
  effect2._depsLength = 0;
  effect2._trackId++;
}
function postCleanEffect(effect2) {
  if (effect2.deps.length > effect2._depsLength) {
    for (let i = effect2._depsLength; i < effect2.deps.length; i++) {
      cleanDepEffect(effect2.deps[i], effect2);
    }
    effect2.deps.length = effect2._depsLength;
  }
}
var ReactiveEffect = class {
  // 收集当前effect内的属性（如name、age）所对应的dep
  // 如果fn中依赖的数据发生变化，需要重新调用run
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this.active = true;
    // 创建的effect是响应式的
    this._trackId = 0;
    // 用于记录当前effect执行了几次
    this._depsLength = 0;
    this._running = 0;
    // 正在执行时不为0
    this._dirtyLevel = 4 /* Dirty */;
    this.deps = [];
  }
  get dirty() {
    return this._dirtyLevel === 4 /* Dirty */;
  }
  set dirty(v) {
    this._dirtyLevel = v ? 4 /* Dirty */ : 0 /* NoDirty */;
  }
  run() {
    this._dirtyLevel = 0 /* NoDirty */;
    if (!this.active) {
      return this.fn();
    }
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      preCleanEffect(this);
      this._running++;
      return this.fn();
    } finally {
      this._running--;
      postCleanEffect(this);
      activeEffect = lastEffect;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
      preCleanEffect(this);
      postCleanEffect(this);
    }
  }
};
function cleanDepEffect(dep, effect2) {
  dep.delete(effect2);
  if (dep.size === 0) {
    dep.cleanup();
  }
}
function trackEffect(effect2, dep) {
  if (dep.get(effect2) !== effect2._trackId) {
    dep.set(effect2, effect2._trackId);
    const oldDep = effect2.deps[effect2._depsLength];
    if (oldDep !== dep) {
      effect2.deps[effect2._depsLength++] = dep;
      if (oldDep) {
        cleanDepEffect(oldDep, effect2);
      }
    } else {
      effect2._depsLength++;
    }
  }
}
function triggerEffects(dep) {
  for (const effect2 of dep.keys()) {
    if (effect2._dirtyLevel < 4 /* Dirty */) {
      effect2._dirtyLevel = 4 /* Dirty */;
    }
    if (effect2._running === 0) {
      if (effect2.scheduler) {
        effect2.scheduler();
      }
    }
  }
}

// packages/reactivity/src/reactiveEffect.ts
var targetMap = /* @__PURE__ */ new WeakMap();
function createDep(cleanup) {
  let dep = /* @__PURE__ */ new Map();
  dep.cleanup = cleanup;
  return dep;
}
function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = createDep(() => {
        depsMap.delete(key);
      }));
    }
    trackEffect(activeEffect, dep);
  }
}
function trigger(target, key, value, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  if (!dep) {
    return;
  }
  triggerEffects(dep);
}

// packages/reactivity/src/baseHandler.ts
var mutableHandlers = {
  get(target, key, receiver) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    track(target, key);
    const res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    const oldValue = target[key];
    const result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return result;
  }
};

// packages/reactivity/src/reactive.ts
var reactiveMap = /* @__PURE__ */ new WeakMap();
function createReactiveObject(target) {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v_isReactive" /* IS_REACTIVE */]) {
    return target;
  }
  const exitsProxy = reactiveMap.get(target);
  if (exitsProxy) {
    return exitsProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
function reactive(target) {
  return createReactiveObject(target);
}
function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}
function isReactive(value) {
  return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
}

// packages/reactivity/src/ref.ts
function createRef(value) {
  return new RefImpl(value);
}
var RefImpl = class {
  // 当前被包裹属性的effect
  constructor(rawValue) {
    this.rawValue = rawValue;
    this.__v_isRef = true;
    this._value = toReactive(rawValue);
  }
  get value() {
    track2(this);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = toReactive(newValue);
      this._value = toReactive(newValue);
      trigger2(this);
    }
  }
};
function track2(ref2) {
  if (activeEffect) {
    if (!ref2.dep) {
      ref2.dep = createDep(() => ref2.dep = void 0);
    }
    trackEffect(activeEffect, ref2.dep);
  }
}
function trigger2(ref2) {
  if (ref2.dep) {
    triggerEffects(ref2.dep);
  }
}
function ref(value) {
  return createRef(value);
}
function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}
var ObjectRefImpl = class {
  constructor(_object, _key) {
    this._object = _object;
    this._key = _key;
    this.__v_isRef = true;
  }
  // 先简单理解，这里不用Reflect的原因是传进来的_object是响应式，已做过track
  // 而new Proxy时，传入的target不是响应式的，直接target[key]不会触发get
  // new Proxy时使用Reflect，是因为其get是返回的proxy对象获取时才会触发，
  // 而原对象里有getter，getter里的this不会触发proxy对象的get，会漏收集track，
  // 这里如果_object里有getter，也不会触发这里的get，只会触发proxy监听里的get，
  // 但是这里不用收集track，不触发也无所谓
  get value() {
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;
  }
};
function toRefs(object) {
  const res = {};
  for (const key in object) {
    res[key] = toRef(object, key);
  }
  return res;
}
function proxyRefs(objectWithRefs) {
  if (objectWithRefs["__v_isReactive" /* IS_REACTIVE */]) {
    return objectWithRefs;
  }
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver);
      return res.__v_isRef ? res.value : res;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if (oldValue.__v_isRef && !value.__v_isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    }
  });
}
function isRef(value) {
  return !!(value && value.__v_isRef);
}

// packages/reactivity/src/computed.ts
var ComputedRefImpl = class {
  constructor(getter, setter) {
    this.setter = setter;
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        trigger2(this);
      }
    );
  }
  get value() {
    if (this.effect.dirty) {
      this._value = this.effect.run();
      track2(this);
    }
    return this._value;
  }
  set value(v) {
    this.setter(v);
  }
};
function computed(getterOrOptions) {
  const onlyGetter = isFunction(getterOrOptions);
  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}

// packages/reactivity/src/apiWatch.ts
function watch(source, cb, options = {}) {
  return doWatch(source, cb, options);
}
function watchEffect(source, options = {}) {
  return doWatch(source, null, options);
}
function traverse(source, depth, currentDepth = 0, seen = /* @__PURE__ */ new Set()) {
  if (!isObject(source)) {
    return source;
  }
  if (depth) {
    if (currentDepth >= depth) {
      return source;
    }
    currentDepth++;
  }
  if (seen.has(source)) {
    return source;
  }
  seen.add(source);
  for (const key in source) {
    traverse(source[key], depth, currentDepth, seen);
  }
  return source;
}
function reactiveGetter(source, deep) {
  let depth;
  if (isNumber(deep)) {
    depth = deep;
  } else {
    if (deep === false) {
      depth = 1;
    } else {
      depth = Infinity;
    }
  }
  return () => traverse(source, depth);
}
function doWatch(source, cb, { deep, immediate }) {
  let getter = () => {
  };
  if (isReactive(source)) {
    getter = reactiveGetter(source, deep);
  } else if (isRef(source)) {
    getter = () => source.value;
  } else if (isFunction(source)) {
    getter = source;
  }
  let oldValue;
  let clean;
  const onCleanup = (fn) => {
    clean = () => {
      fn();
      clean = void 0;
    };
  };
  const job = () => {
    if (clean) {
      clean();
    }
    if (cb) {
      const newValue = effect2.run();
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    } else {
      effect2.run();
    }
  };
  if (!cb) {
    getter = () => {
      source(onCleanup);
    };
  }
  const effect2 = new ReactiveEffect(getter, job);
  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect2.run();
    }
  } else {
    effect2.run();
  }
  return () => effect2.stop();
}

// packages/runtime-core/src/scheduler.ts
var queue = [];
var isFlushing = false;
var resolvedPromise = Promise.resolve();
function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isFlushing) {
    isFlushing = true;
    resolvedPromise.then(() => {
      isFlushing = false;
      const copy = queue.slice(0);
      queue.length = 0;
      copy.forEach((job2) => {
        job2();
      });
      copy.length = 0;
    });
  }
}

// packages/runtime-core/src/component.ts
function createComponentInstance(vNode, parent) {
  const { props: propsOptions = {} } = vNode.type;
  const instance = {
    data: null,
    // 状态(组件里的响应式data)
    vNode,
    // 组件的虚拟节点
    subtree: null,
    // 子树(组件里render返回的vNode)
    isMounted: false,
    // 是否挂载完成
    update: null,
    // 组件更新的函数
    props: {},
    attrs: {},
    slots: {},
    exposed: null,
    propsOptions,
    // 用户定义的props
    component: null,
    proxy: null,
    // 用来代理 data、props、attrs让用户使用更加方便
    render: null,
    next: null,
    // props、slot更新时，缓存的vNode
    setupState: null,
    // setup返回的对象
    parent,
    provides: parent ? parent.provides : /* @__PURE__ */ Object.create(null)
  };
  return instance;
}
var currentInstance = null;
var getCurrentInstance = () => currentInstance;
var setCurrentInstance = (v) => {
  currentInstance = v;
};
var unsetCurrentInstance = () => {
  currentInstance = null;
};
var publicPrototype = {
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots
  // ...
};
var handler = {
  get(target, key) {
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    }
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
      console.warn("props are readonly");
      return false;
    } else if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value;
    }
    return true;
  }
};
var initProps = (instance, rawProps) => {
  const props = {};
  const attrs = {};
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
    instance.props = reactive(props);
    instance.attrs = attrs;
  }
};
var initSlots = (instance, children) => {
  const { slots } = instance;
  if (instance.vNode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
    for (const key in children) {
      slots[key] = children[key];
    }
  } else if (children) {
    if (Array.isArray(children)) {
      slots.default = () => createVNode(
        Fragment,
        null,
        children.slice()
      );
    }
  }
};
function setupComponent(instance) {
  const { vNode } = instance;
  initProps(instance, vNode.props);
  initSlots(instance, vNode.children);
  instance.proxy = new Proxy(instance, handler);
  let { data, render: render2, setup } = vNode.type;
  if (setup) {
    const setupContext = {
      // emit,attrs,expose,slots
      attrs: instance.attrs,
      slots: instance.slots,
      emit(event, ...payload) {
        const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
        const handler2 = instance.vNode.props[eventName];
        handler2 && handler2(...payload);
      },
      expose(value) {
        instance.exposed = value;
      }
    };
    setCurrentInstance(instance);
    const setupResult = setup(instance.props, setupContext);
    unsetCurrentInstance();
    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else if (isObject(setupResult)) {
      instance.setupState = proxyRefs(setupResult);
    } else {
      console.warn("setup() should return an function or object.");
    }
  }
  if (data) {
    if (!isFunction(data)) {
      console.warn("data option must be a function.");
      data = () => {
      };
    }
    instance.data = reactive(data.call(instance.proxy));
  }
  if (!instance.render) {
    instance.render = render2;
  }
}

// packages/runtime-core/src/apiLifecycle.ts
var createHook = (type) => {
  return (hook, target = currentInstance) => {
    if (target) {
      const hooks = target[type] || (target[type] = []);
      const wrapHook = () => {
        setCurrentInstance(target);
        hook.call(target);
        unsetCurrentInstance();
      };
      hooks.push(wrapHook);
    }
  };
};
var onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
var onMounted = createHook("m" /* MOUNTED */);
var onBeforeUpdate = createHook("bu" /* BEFORE_UPDATE */);
var onUpdated = createHook("u" /* UPDATE */);
var invokeArray = (fns) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i]();
  }
};

// packages/runtime-core/src/renderer.ts
function createRenderer(renderOptions2) {
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
  } = renderOptions2;
  const unmount = (vNode) => {
    const { shapeFlag } = vNode;
    if (vNode.type === Fragment) {
      unmountChildren(vNode.children);
    } else if (shapeFlag & 6 /* COMPONENT */) {
      unmount(vNode.component.subtree);
    } else if (shapeFlag & 64 /* TELEPORT */) {
      vNode.type.remove(vNode, internals);
    } else {
      hostRemove(vNode.el);
    }
  };
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };
  const mountChildren = (children, container, anchor, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i] = normalizeVNode(children[i]);
      patch(null, child, container, anchor, parentComponent);
    }
  };
  const mountElement = (vNode, container, anchor, parentComponent) => {
    const { type, props, children, shapeFlag } = vNode;
    const el = vNode.el = hostCreateElement(type);
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      hostSetElementText(el, children);
    } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      mountChildren(children, el, null, parentComponent);
    }
    hostInsert(el, container, anchor);
  };
  const patchProps = (oldProps, newProps, el) => {
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    for (const key in oldProps) {
      if (!newProps[key]) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };
  const patchKeyedChildren = (c1, c2, el, anchor, parentComponent) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i] = normalizeVNode(c2[i]);
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el, anchor, parentComponent);
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2] = normalizeVNode(c2[e2]);
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el, anchor, parentComponent);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor2 = c2[nextPos] === void 0 ? null : c2[nextPos].el;
        while (i <= e2) {
          patch(null, c2[i] = normalizeVNode(c2[i]), el, anchor2, parentComponent);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    } else {
      const s1 = i;
      const s2 = i;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      const toBePatched = e2 - s2 + 1;
      const newIndexToOldMapIndex = new Array(toBePatched).fill(0);
      for (i = s2; i <= e2; i++) {
        const vNode = c2[i] = normalizeVNode(c2[i]);
        if (vNode.key !== void 0) {
          keyToNewIndexMap.set(vNode.key, i);
        }
      }
      for (let i2 = s1; i2 <= e1; i2++) {
        const vNode = c1[i2];
        const newIndex = keyToNewIndexMap.get(vNode.key);
        if (newIndex == void 0) {
          unmount(vNode);
        } else {
          newIndexToOldMapIndex[newIndex - s2] = i2 + 1;
          patch(vNode, c2[newIndex], el, anchor, parentComponent);
        }
      }
      const increasingSeq = getSequence(newIndexToOldMapIndex);
      let j = increasingSeq.length - 1;
      for (i = toBePatched - 1; i >= 0; i--) {
        const newIndex = s2 + i;
        const newChild = c2[newIndex];
        const anchor2 = c2[newIndex + 1]?.el;
        if (newChild.el) {
          if (i == increasingSeq[j]) {
            j--;
          } else {
            hostInsert(newChild.el, el, anchor2);
          }
        } else {
          patch(null, newChild, el, anchor2, parentComponent);
        }
      }
    }
  };
  const patchChildren = (n1, n2, el, anchor, parentComponent) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        patchKeyedChildren(c1, c2, el, anchor, parentComponent);
      } else {
        hostSetElementText(el, "");
        mountChildren(c2, el, null, parentComponent);
      }
    } else if (shapeFlag & 1 /* ELEMENT */) {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        unmountChildren(c1);
      } else {
        hostSetElementText(el, "");
      }
    }
  };
  const patchElement = (n1, n2, parentComponent) => {
    const el = n2.el = n1.el;
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    patchProps(oldProps, newProps, el);
    n2.props = n1.props;
    patchChildren(n1, n2, el, null, parentComponent);
    n2.children = n1.children;
  };
  const processElement = (n1, n2, container, anchor, parentComponent) => {
    if (n1 === null) {
      mountElement(n2, container, anchor, parentComponent);
    } else {
      patchElement(n1, n2, parentComponent);
    }
  };
  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(n2.el = hostCreateText(n2.children), container, anchor);
    } else {
      const el = n2.el = n1.el;
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children);
      }
    }
  };
  const processFragment = (n1, n2, container, anchor, parentComponent) => {
    if (n1 == null) {
      mountChildren(n2.children, container, null, parentComponent);
    } else {
      patchChildren(n1, n2, container, null, parentComponent);
    }
  };
  const hasPropsChanged = (prevProps, nextProps) => {
    if (!prevProps) {
      return !!nextProps;
    }
    if (!nextProps) {
      return true;
    }
    const nKeys = Object.keys(nextProps);
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
  const updateProps = (instance, prevProps, nextProps) => {
    const { propsOptions } = instance;
    if (hasPropsChanged(prevProps, nextProps)) {
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
  const shouldComponentUpdate = (n1, n2) => {
    const { props: prevProps, children: prevChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;
    if (prevChildren || nextChildren) return true;
    if (prevProps === nextProps) return false;
    if (!prevProps) {
      return !!nextProps;
    }
    if (!nextProps) {
      return true;
    }
    return hasPropsChanged(prevProps, nextProps);
  };
  const updateComponent = (n1, n2) => {
    const instance = n2.component = n1.component;
    if (shouldComponentUpdate(n1, n2)) {
      instance.next = n2;
      instance.update();
    }
  };
  const updateComponentPreRender = (instance, next) => {
    instance.next = null;
    const { props: prevProps } = instance.vNode;
    const { props: nextProps } = next;
    instance.vNode = next;
    updateProps(instance, prevProps, nextProps);
  };
  const setupRenderEffect = (instance, container, anchor) => {
    const { render: render3 } = instance;
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const { bm, m } = instance;
        if (bm) {
          invokeArray(bm);
        }
        const subtree = render3.call(instance.proxy, instance.proxy);
        patch(null, subtree, container, anchor, instance);
        instance.isMounted = true;
        instance.subtree = subtree;
        if (m) {
          invokeArray(m);
        }
      } else {
        const { next, bu, u } = instance;
        if (bu) {
          invokeArray(bu);
        }
        if (next) {
          updateComponentPreRender(instance, next);
        }
        const subtree = render3.call(instance.proxy, instance.proxy);
        patch(instance.subtree, subtree, container, anchor, instance);
        instance.subtree = subtree;
        if (u) {
          invokeArray(u);
        }
      }
    };
    const effect2 = new ReactiveEffect(componentUpdateFn, () => {
      queueJob(update);
    });
    const update = instance.update = () => effect2.run();
    update();
  };
  const mountComponent = (vNode, container, anchor, parentComponent) => {
    const instance = vNode.component = createComponentInstance(vNode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, container, anchor);
  };
  const processComponent = (n1, n2, container, anchor, parentComponent) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor, parentComponent);
    } else {
      updateComponent(n1, n2);
    }
  };
  const setRef = (rawRef, vNode) => {
    const value = vNode.shapeFlag & 4 /* STATEFUL_COMPONENT */ ? vNode.component.exposed || vNode.component.proxy : vNode.el;
    if (isRef(rawRef)) {
      rawRef.value = value;
    }
  };
  const move = (vNode, container, anchor) => {
    const el = vNode.component ? vNode.component.subtree.el : vNode.el;
    hostInsert(el, container, anchor);
  };
  const internals = {
    um: unmount,
    m: move,
    mc: mountChildren,
    pc: patchChildren
  };
  const patch = (n1, n2, container, anchor, parentComponent) => {
    if (n1 === n2) {
      return;
    }
    ;
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    const { type, shapeFlag, ref: ref2 } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor);
        break;
      case Fragment:
        processFragment(n1, n2, container, anchor, parentComponent);
        break;
      default:
        if (shapeFlag & 1 /* ELEMENT */) {
          processElement(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & 6 /* COMPONENT */) {
          processComponent(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & 64 /* TELEPORT */) {
          type.process(n1, n2, container, anchor, parentComponent, internals);
        }
        break;
    }
    if (ref2 != null) {
      setRef(ref2, n2);
    }
  };
  const render2 = (vNode, container) => {
    if (vNode == null) {
      if (container._vNode) {
        unmount(container._vNode);
      }
    } else {
      patch(container._vNode || null, vNode, container);
    }
    container._vNode = vNode;
  };
  return {
    render: render2
  };
}

// packages/runtime-core/src/h.ts
function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren);
    } else {
      return createVNode(type, null, propsOrChildren);
    }
  } else if (l === 3) {
    if (isVNode(children)) {
      return createVNode(type, propsOrChildren, [children]);
    }
  } else if (l > 3) {
    return createVNode(type, propsOrChildren, Array.from(arguments).slice(2));
  }
  return createVNode(type, propsOrChildren, children);
}

// packages/runtime-core/src/apiInject.ts
var provide = (key, value) => {
  if (!currentInstance) {
    return;
  }
  let provides = currentInstance.provides;
  const parentProvides = currentInstance.parent && currentInstance.parent.provides;
  if (provides === parentProvides) {
    provides = currentInstance.provides = Object.create(parentProvides);
  }
  provides[key] = value;
};
var inject = (key, defaultValue) => {
  if (!currentInstance) {
    return;
  }
  const parentProvides = currentInstance.parent && currentInstance.parent.provides;
  if (parentProvides && key in parentProvides) {
    return parentProvides[key];
  } else {
    return defaultValue;
  }
};

// packages/runtime-core/src/components/Teleport.ts
var Teleport = {
  name: "Teleport",
  __isTeleport: true,
  process(n1, n2, container, anchor, parentComponent, internals) {
    const {
      m: move,
      mc: mountChildren,
      pc: patchChildren
    } = internals;
    if (n1 == null) {
      const target = n2.target = document.querySelector(n2.props.to);
      if (target) {
        mountChildren(n2.children, target, anchor, parentComponent);
      }
    } else {
      patchChildren(n1, n2, n2.target, anchor, parentComponent);
      if ((n2.props && n2.props.to) !== (n1.props && n1.props.to)) {
        const nextTarget = n2.target = document.querySelector(n2.props.to);
        if (n2.shapeFlag & 16 /* ARRAY_CHILDREN */) {
          for (let child of n2.children) {
            move(child, nextTarget, anchor);
          }
        }
      }
    }
  },
  remove(vNode, internals) {
    const { children, shapeFlag } = vNode;
    const { um: unmount } = internals;
    if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      for (let child of children) {
        unmount(child);
      }
    }
  }
};

// packages/runtime-core/src/apiAsyncComponent.ts
function defineAsyncComponent(source) {
  return {
    setup() {
      if (isFunction(source)) {
        source = {
          loader: source
        };
      }
      const {
        loader,
        errorComponent,
        delay = 200,
        loadingComponent,
        timeout,
        onError: userOnError
      } = source;
      let resolvedComp = null;
      const loaded = ref(false);
      const error = ref(false);
      const delayed = ref(!!delay);
      if (delay) {
        setTimeout(() => {
          delayed.value = false;
        }, delay);
      }
      if (timeout != null) {
        setTimeout(() => {
          if (!loaded.value && !error.value) {
            const err = new Error(
              `Async component timed out after ${timeout}ms.`
            );
            error.value = err;
          }
        }, timeout);
      }
      let retries = 0;
      const load = () => {
        return loader().catch((err) => {
          err = err instanceof Error ? err : new Error(String(err));
          if (userOnError) {
            return new Promise((resolve, reject) => {
              const userRetry = () => resolve(load());
              const userFail = () => reject(err);
              userOnError(err, userRetry, userFail, ++retries);
            });
          } else {
            throw err;
          }
        });
      };
      load().then((comp) => {
        resolvedComp = comp;
        loaded.value = true;
      }).catch((err) => {
        error.value = err;
        throw err;
      });
      return () => {
        if (loaded.value && resolvedComp) {
          return h(resolvedComp);
        } else if (error.value && errorComponent) {
          return h(errorComponent);
        } else if (!delayed.value && loadingComponent) {
          return h(loadingComponent);
        } else {
          return h("div");
        }
      };
    }
  };
}

// packages/runtime-dom/src/index.ts
var renderOptions = Object.assign({ patchProp }, nodeOps);
var render = (vNode, container) => {
  return createRenderer(renderOptions).render(vNode, container);
};
export {
  Fragment,
  ReactiveEffect,
  Teleport,
  Text,
  activeEffect,
  computed,
  createComponentInstance,
  createRenderer,
  createVNode,
  currentInstance,
  defineAsyncComponent,
  effect,
  getCurrentInstance,
  h,
  inject,
  invokeArray,
  isReactive,
  isRef,
  isSameVNodeType,
  isTeleport,
  isVNode,
  normalizeVNode,
  onBeforeMount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
  provide,
  proxyRefs,
  reactive,
  ref,
  render,
  renderOptions,
  setCurrentInstance,
  setupComponent,
  toReactive,
  toRef,
  toRefs,
  track2 as track,
  trackEffect,
  trigger2 as trigger,
  triggerEffects,
  unsetCurrentInstance,
  watch,
  watchEffect
};
//# sourceMappingURL=runtime-dom.js.map
