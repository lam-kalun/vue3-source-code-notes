// 通过事件循环的机制，延迟更新操作，先走宏任务 -> 微任务(更新操作)

const queue = [];
let isFlushing = false;
const resolvedPromise = Promise.resolve();

// 如果同时在一个组件中更新多个状态(data)，job会是同一个
// 一个job对应一个组件
// 一个宏任务(同时在一个组件中更新多个状态)，让其执行同一个微任务(resolvePromise)
// 一次宏任务中只执行一次更新
export function queueJob(job){
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isFlushing) {
    isFlushing = true;
    resolvedPromise.then(() => {
      isFlushing = false;
      const copy = queue.slice(0);
      queue.length = 0;
      copy.forEach(job => { job() });
      copy.length = 0;
    });
  }
};