import { isFunction } from "@vue/shared";
import { ref } from "@vue/reactivity";
import { h } from "./h";

// 返回一个Component
export function defineAsyncComponent(source) {
  return {
    setup() {
      if (isFunction(source)) {
        source = {
          loader: source
        }
      }
      const {
        loader,
        errorComponent,
        delay = 200,
        loadingComponent,
        timeout,
        onError: userOnError
      } = source;
      // 要异步加载的组件
      let resolvedComp = null;
      // 成功标识
      const loaded = ref(false);
      // 失败标识
      const error = ref(false);
      // 是否在延迟时间内
      const delayed = ref(!!delay);

      if (delay) {
        // 如果delay > 组件异步加载的时间
        // 触发setTimeout回调前，loaded.value已经为true了，effect执行render函数时，不会再track delay了
        setTimeout(() => {
          delayed.value = false;
        }, delay);
      }

      if (timeout != null) {
        setTimeout(() => {
          if (!loaded.value && !error.value) {
            const err = new Error(
              `Async component timed out after ${timeout}ms.`,
            );
            error.value = err;
          }
        }, timeout);
      }

      let retries = 0
      // 拦截load的err，让用户自己处理err
      const load = () => {
        // .catch、.then、.finally会返回一个Promise
        return loader().catch((err) => {
          // 防止reject(false)时，error.value不能通过error.value &&
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
      }

      load()
        .then((comp) => {
          resolvedComp = comp;
          loaded.value = true;
        })
        .catch((err) => {
          error.value = err;
          throw err;
        });
      // 响应式数据要在render函数里才会被effect记录
      return () => {
        // 只要loaded.value为true，其他都不用effect记录和考虑了
        if (loaded.value && resolvedComp) {
          return h(resolvedComp);
        } else if (error.value && errorComponent) {
          return h(errorComponent);
        } else if (!delayed.value && loadingComponent) {
          return h(loadingComponent);
        } else {
          // todo 源码是<!-->
          return h('div');
        }
      };
    }
  };
};