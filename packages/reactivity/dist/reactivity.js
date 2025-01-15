// packages/shared/src/index.ts
var isObject = (value) => {
  return typeof value === "object" && value !== null;
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
    this.deps = [];
  }
  run() {
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
  get(target, key, recevier) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    track(target, key);
    const res = Reflect.get(target, key, recevier);
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, recevier) {
    const oldValue = target[key];
    const result = Reflect.set(target, key, value, recevier);
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
      this.rawValue = newValue;
      this._value = newValue;
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
  }
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
export {
  activeEffect,
  effect,
  reactive,
  ref,
  toReactive,
  toRef,
  toRefs,
  trackEffect,
  triggerEffects
};
//# sourceMappingURL=reactivity.js.map
