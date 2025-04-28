import { currentInstance, setCurrentInstance, unsetCurrentInstance } from "./component";

const enum Lifecycle {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATE = 'u'
};

// 闭包，将instance存放在当前函数上
const createHook = (type) => {
  return (hook, target = currentInstance) => {
    // 当前钩子是否在组件中运行
    if (target) {
      // 发布订阅(track)
      // 把cb放到组件实例上
      const hooks = (target[type] || (target[type] = []));
      // 执行钩子时，因为setup已经执行完了，instance变成了null，所以拿不到钩子所在组件的实例了
      // 将闭包里的instance，在执行钩子时，放到全局currentInstance上，执行钩子后清除
      const wrapHook = () => {
        setCurrentInstance(target);
        hook.call(target);
        unsetCurrentInstance();
      };
      hooks.push(wrapHook);
    }
  };
};

export const onBeforeMount = createHook(Lifecycle.BEFORE_MOUNT);
export const onMounted = createHook(Lifecycle.MOUNTED);
export const onBeforeUpdate = createHook(Lifecycle.BEFORE_UPDATE);
export const onUpdated = createHook(Lifecycle.UPDATE);

export const invokeArray = (fns) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i]();
  }
};