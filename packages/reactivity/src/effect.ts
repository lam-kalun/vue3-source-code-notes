/*
  fn 用户编写的回调
*/
export function effect(fn, options?) {
  // 创建effect实例，只要依赖的属性发生变化，就要执行回调（回调里放入fn）
  const _effect = new ReactiveEffect(
    fn,
    () => {
      _effect.run();
    }
  );
  _effect.run();
}

export let activeEffect;
class ReactiveEffect {
  public active = true; // 创建的effect是响应式的
  _trackId = 0; // 用于记录当前effect执行了几次
  deps = []; // 收集当前effect内的属性（如name、age）收集了多少个属性的dep
  _depsLength = 0;
  
  // 如果fn中依赖的数据发生变化，需求重新调用run
  constructor(public fn, public scheduler) {}

  run() {
    // 让fn执行
    if (!this.active) {
      return this.fn(); // 不是激活的，执行后，什么都不用做
    }

    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      return this.fn(); // 便于第一次触发run时，key与activeEffect（实例）对应，收集依赖
    }finally {
      activeEffect = lastEffect;
    }
  }
}

export function trackEffect(effect, dep) {
  dep.set(effect, effect._trackId);
  effect.deps[effect._depsLength++] = dep;
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    effect.scheduler();
  }
}