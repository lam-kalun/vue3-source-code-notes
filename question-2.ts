// 非初始化的render里，新旧children都是数组时，乱序时更优的更新算法原理和例子
// 最长递增子序列
// 贪心算法 + 二分查找
// 2 3 1 5 6 8 7 9 4

// 2
// 2 3
// 1 3
// 1 3 5
// 1 3 5 6
// 1 3 5 6 8
// 1 3 5 6 7
// 1 3 5 6 7 9
// 1 3 4 6 7 9

// 2 3 1 5 6 8 7 9 4 5 6 7 8 9 10

// 2
// 2 3
// 1 3
// 1 3 5
// 1 3 5 6
// 1 3 5 6 8
// 1 3 5 6 7
// 1 3 5 6 7 9
// 1 3 4 6 7 9
// 1 3 4 5 7 9
// 1 3 4 5 6 9
// 1 3 4 5 6 7
// 1 3 4 5 6 7 8
// 1 3 4 5 6 7 8 9
// 1 3 4 5 6 7 8 9 10

// 例子：
// c1: a b c e f j d h
// c2: a b c d e f g k h

// e f j d
// [3, 4, 5, 6]

// d e f g k
// [6, 3, 4, 0, 0]

// 6
// 3
// 3 4
// 0 4
// 0 4

// 3 4
