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
  // 如果fn中依赖的数据发生变化，需求重新调用run
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
  const job = () => {
    if (cb) {
      const newValue = effect2.run();
      cb(newValue, oldValue);
      oldValue = newValue;
    } else {
      effect2.run();
    }
  };
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
export {
  ReactiveEffect,
  activeEffect,
  computed,
  effect,
  isReactive,
  isRef,
  proxyRefs,
  reactive,
  ref,
  toReactive,
  toRef,
  toRefs,
  track2 as track,
  trackEffect,
  trigger2 as trigger,
  triggerEffects,
  watch,
  watchEffect
};
//# sourceMappingURL=reactivity.js.map
