import { DirtyLevels } from "./constants";

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

  // 比如用scheduler覆盖ReactiveEffect里的scheduler，让更新后，执行传进来的scheduler
  // 首次执行effect，还是会执行ReactiveEffect里的scheduler
  if (options) {
    Object.assign(_effect, options);
  }
  const runner = _effect.run.bind(_effect);
  return runner;
}

export let activeEffect;

function preCleanEffect(effect) {
  effect._depsLength = 0;
  effect._trackId++; // 每次执行id + 1, 如果当前同一个effect执行，id是相同的
}

function postCleanEffect(effect) {
  if (effect.deps.length > effect._depsLength) {
    // 删除依赖列表中，多余的属性对应的映射（effect.deps[i]）中，对当前effect的记录
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect);
    }

    // 更新依赖列表
    effect.deps.length = effect._depsLength;
  }
}
export class ReactiveEffect {
  public active = true; // 创建的effect是响应式的
  _trackId = 0; // 用于记录当前effect执行了几次
  _depsLength = 0;
  _running = 0; // 正在执行时不为0
  _dirtyLevel = DirtyLevels.Dirty;

  deps = []; // 收集当前effect内的属性（如name、age）所对应的dep
  
  // 如果fn中依赖的数据发生变化，需求重新调用run
  constructor(public fn, public scheduler) {}

  public get dirty() {
    return this._dirtyLevel === DirtyLevels.Dirty;
  }

  public set dirty(v) {
    this._dirtyLevel = v ? DirtyLevels.Dirty : DirtyLevels.NoDirty;
  }

  run() {
    // 每次运行后effect变为no_dirty
    this._dirtyLevel = DirtyLevels.NoDirty;
    // 让fn执行
    if (!this.active) {
      return this.fn(); // 不是激活的，执行后，什么都不用做
    }

    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      preCleanEffect(this); // 每次执行effect时调用
      this._running++;
      // 便于第一次触发run时，key与activeEffect（实例）对应，收集依赖
      // 属性修改后，先触发属性修改的set，再触发effect里属性的get，代码（finally）再往下走
      return this.fn();
    } finally {
      this._running--;
      postCleanEffect(this); // 清除多余的deps项
      activeEffect = lastEffect;
    }
  }
}

function cleanDepEffect(dep, effect) {
  dep.delete(effect);
  // 如果dep里没有effect了，把对象对应的depsMap里，对应的属性dep去掉
  if (dep.size === 0) {
    dep.cleanup();
  }
}

export function trackEffect(effect, dep) {
  // 双向记忆
  // 一次effect执行里，同一个属性不记录多次了
  // 比如effect(() => {app.innerHTML = `${state.name}${state.name}${state.name}`})
  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId);

    // 取effect记录的deps，来和dep做比较(如果effect里依赖的属性没变，dep触发记录的顺序会和deps里一样)
    // 比如deps = [flag, name], dep = flag
    const oldDep = effect.deps[effect._depsLength];
    if (oldDep !== dep) {
      // 不一致，就把deps当前项替换为dep
      effect.deps[effect._depsLength++] = dep;

      // 同时把去掉的deps当前项，其dep里记录的当前effect去掉
      // 首次执行effect时，deps首次入值，_depsLength位置对应的oldDep当然为空
      if (oldDep) {
        cleanDepEffect(oldDep, effect);
      }
    } else {
      // 如果一致，就不动deps当前项，跳过
      effect._depsLength++;
    }
  }
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    // computed逻辑，依赖的值触发更新后，effect变为脏
    if (effect._dirtyLevel < DirtyLevels.Dirty) {
      effect._dirtyLevel = DirtyLevels.Dirty;
    }
    if (effect._running === 0) {
      if (effect.scheduler) {
        effect.scheduler();
      }
    }
  }
}