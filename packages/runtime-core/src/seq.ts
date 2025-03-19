// 获取新children需要跳过的混乱(去掉前后相同后)的数组下标
// arr 和新的children混乱的数组一样长，映射的是旧的children的数组下标+1(非旧的混乱的数组)，旧的有，新的没有，就为0
// result 不一定和新的children混乱的数组一样长(因为push后可能会替换值)，最长递增子序列，在混乱的数组里的下标
// p 和新的children混乱的数组一样长，在result.push()前，记录当前项的前一个下标（也是混乱的数组里的下标）
export default function getSequence(arr) {
  const result = [0];
  const p = result.slice(0);
  const len = arr.length;

  for (let i = 0; i < len; i++) {
    const arrI = arr[i];
    // 为0证明是新的children里新增的，肯定不用放入result里了
    if (arrI !== 0) {
      // result最后一项
      const resultLastIndex = result[result.length - 1];
      // 新进来的arrI，比result最后一项对应在arr里的数值大，记录其在arr的下标
      if (arr[resultLastIndex] < arrI) {
        p.push(result[result.length - 1]);
        result.push(i);
        continue;
      }

      // 二分法查找位置（第一个比arrI大的后面）
      let start = 0;
      let end = result.length - 1;
      let middle;

      while (start < end) {
        middle = ( start + end ) / 2 | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }

      // 最后会得到start==end，
      // 要么arrI（i对应下标的数值）==arr[result[start]]（不用操作），
      // 要么arrI（i对应下标的数值）<arr[result[start]]（i要替换result[start]的值）
      if (arrI < arr[result[start]]) {
        p[i] = result[start - 1];
        result[start] = i;
      }

      // 追溯
      // last result最后一项
      let l = result.length;
      let last = result[l - 1];
      while (l-- > 0) {
        result[l] = last;
        // result[l]的前一项在arr对应的下标
        last = p[last];
      }
    }
  }
  return result;
}