---
title: 算法储备
categories: Algorithm
toc: true
comments: true
copyright: true
visible: true
date: 2018-10-14 00:24:16
tags:
mathjax: true
---

设计好数学模型，才能带入算法。

<!--more-->

## 基础

### 入门

警察抓了 A、B、C、D 四名罪犯，其中一名是小偷，审讯的时候：

```java
A说：“我不是小偷。”    x !=0
B说：“C 是小偷。”     x = 2
C说：“小偷肯定是 D。”  x = 3 
D说：“C 是在冤枉人。”  x != 3
```

假设说真话记为 1，假话记为 0，小偷为 x，那么 ABCD 的总和应为 3。对 ABCD 编号为 0123，依次假设 x 为 其中一个人。

```java
for(int x = 0; x < 4; x++) {
  int dis_a = (x != 0) ? 1 : 0;
  int dis_b = (x == 2) ? 1 : 0;
  int dis_c = (x == 3) ? 1 : 0;
  int dis_d = (x != 3) ? 1 : 0;
  if (dis_a + dis_b + dis_c + dis_d == 3) {
    // find theif, number is x
  }
}
```

### 贪婪算法

又称贪心算法，一般讲问题求解分成若干步，每一步都应用贪心原则，选取当下最好的选择。

贪婪法每一步局部最优解选择完之后，就确定了，不会进行回溯处理。

贪婪法只在很少的情况下能得到全局的最优解，比如最短路径问题，因为选择策略的「短视」。

0-1 背包问题
```java
有一个背包，最多能承载重量为 C=150 的物品，现在有 7 个物品（物品不能分割成任意大小），编号为 1~7，
重量分别是 wi=[35、30、60、50、40、10、25]，价值分别是 pi=[10、40、30、50、35、40、30]，
现在从这 7 个物品中选择一个或多个装入背包，
要求在物品总重量不超过 C 的前提下，所装入的物品总价值最高。
```

假设装入背包的物品状态为 1，未选为 0, 不可选为 2 （超过体积）。 
```js
// 定义物品及物品集， status 物品状态  0:未选中；1:已选中；2:已经不可选
const products = [
  { id: 1, weight: 35, price: 10, status : 0 },
  { id: 2, weight: 30, price: 40, status : 0 },
  { id: 3, weight: 60, price: 30, status : 0 },
  { id: 4, weight: 50, price: 50, status : 0 },
  { id: 5, weight: 40, price: 35, status : 0 },
  { id: 6, weight: 10, price: 40, status : 0 },
  { id: 7, weight: 25, price: 30, status : 0 }
];
// 定义背包
const bag = {
  sumWeight: 0,
  sumPrice: 0,
  record: []
}
```
```js
// 根据价值选，价值越大，越优先选
const prodWithPriceDesc = products.sort((p1,p2) => p2.price - p1.price);
for (let i = 0; i < prodWithPriceDesc.length; i++) {
  const curProd = prodWithPriceDesc[i];
  if (curProd.weight + bag.sumWeight > 150) {
    curProd.status = 2;
  } else {
    curProd.status = 1;
    bag.sumWeight += curProd.weight;
    bag.sumPrice += curProd.price
    bag.record.push(curProd.id);
  }
}
// bag = { sumWeight : 130, sumPrice: 165, record: [4,2,6,5] }
```
```js
// 根据重量选，重量越轻，越优先选
const prodWithWeightAsc = products.sort((p1,p2) => p1.weight - p2.weight);
for (let i = 0; i < prodWithWeightAsc.length; i++) {
  const curProd = prodWithWeightAsc[i];
  if (curProd.weight + bag.sumWeight > 150) {
    break;
  } else {
    curProd.status = 1;
    bag.sumWeight += curProd.weight;
    bag.sumPrice += curProd.price
    bag.record.push(curProd.id);
  }
}
// bag = { sumWeight : 140, sumPrice: 155, record : [6,7,2,1,5] }
```
```js
// 根据物品的价值密度选（price/weight），价值密度越大，越优先选。
products.forEach(p => { p.density = p.price / p.weight});
const prodWithDensityDesc = products.sort((p1, p2) => p2.density - p1.density);
for (let i = 0; i < prodWithDensityDesc.length; i++) {
  const curProd = prodWithDensityDesc[i];
  if (curProd.weight + bag.sumWeight > 150) {
    curProd.status = 2;
  } else {
    curProd.status = 1;
    bag.sumWeight += curProd.weight;
    bag.sumPrice += curProd.price
    bag.record.push(curProd.id);
  }
}
// bag = { sumWeight : 150, sumPrice: 170, record : [6,2,7,4,1] }
```

### 分治法

将问题分解为若干个规模较小的相同问题，子问题的解以某种方式合并出原始问题得解。

递归是其常见的一种实现方式。

快速排序
```java
public void quickSort(int arr[], int s, int e) {
  if (s < e) {
    int mid = partion(arr, s, e);
    quickSort(arr, s, mid - 1);
    quickSort(arr, mid + 1, e);
  }
}

public int partion(int[] arr, int s, int e) {
  int flag = arr[s];
  while (s < e) {
    while (s < e && arr[e] > flag) {
      e--;
    }
    if (s < e) {
      arr[s] = arr[e];
      s++;
    }
    while (s < e && arr[s] < flag) {
      s++;
    }
    if (s < e) {
      arr[e] = arr[s];
      e--;
    }
  }
  arr[s] = flag;
  return s;
}
// int intArray[] = {12, 56, 22, 78, 102, 6, 90, 57, 29};
// quickSort(intArray, 0, 8);
```

字符串全排列问题
```java
给定一个没有重复字母的字符串，输出该字符串中字符的所有排列。
假如给定的字符串是 "abc"，则应该输出"abc"、"acb"、"bac"、"bca"、"cab"和"cba"六种结果。
```

固定一个字符，对剩余字符排列，反复操作，直至没有剩余字符，输出结果。

选择一个字符，并使其余连在后面，需要在操作前将字符移位（最前一位），并在操作下一个固定字符前归位。

```java
public static void permutation(char[] strArr, int s, int e) {
  if (s == e) {
    System.out.println(String.valueOf(strArr));
  }
  for (int i = s; i < e; i++) {
    swap(strArr, s, i);
    permutation(strArr, s + 1, e);
    swap(strArr, s, i);
  }
}

private static void swap(char[] chars, int s, int i) {
  if (s != i) {
    char temp = chars[s];
    chars[s] = chars[i];
    chars[i] = temp;
  }
}

// String str = "abcd";
// permutation(str.toCharArray(), 0, str.length());
```

### 迭代法

迭代的基本点是迭代公式（递推公式）。

迭代的基本思想：1. 确定迭代变量 2. 确定迭代递推关系 3. 确定迭代终止条件

计算一个数的平方根。牛顿迭代法 $ x_{n+1} = \frac{1}{2}\left(x_n + \frac{a}{x_n}\right)$
```c++
std::pair<bool, double> cl_root(double a, double eps)
{
    double xi = a / 2.0; //初始值用a的一半，很多人的选择
    double xt;
    int count = 0;
    do
    {
        xt = xi;
        xi = (xt + (a / xt)) / 2.0;
        count++; //用于检查是否收敛的计数器
        if (count >= LOOP_LIMIT)
        {
            return {false, 0.0}; //不收敛，返回失败 
        }
    } while (std::fabs(xi - xt) > eps);

    return { true, xi };
}
```

### 动态规划

与分治法类似，将问题分解为多个子问题，由每个子问题的解组合出原问题得解；区别在于，分治法每个子问题是相互独立的，而动态规划的子问题有堆叠关系。

动态规划的原理就是把多阶段决策过程转化为一系列的单阶段决策问题。

最长公共子序列 LCS(Longest Common Subsequence)
```java
一个序列 S，如果分别是两个或多个已知序列的子序列，且是符合此条件的子序列中最长的，则称 S 为已知序列的最长公共子序列。(这里实现对子序列没有连续性要求的算法)
```

```java
public static int lcs(char[] str1, char[] str2) {
  int[][] arr = new int[str1.length + 1][str2.length + 1];
  for (int i = 1; i <= str1.length; i++) {
    arr[i][0] = 0;
  }
  for (int j = 1; j <= str2.length; j++) {
    arr[0][j] = 0;
  }
  for (int i = 1; i <= str1.length; i++) {
    for (int j = 1; j <= str2.length; j++) {
      if (str1[i - 1] == (str2[j - 1])) {
        arr[i][j] = arr[i - 1][j - 1] + 1;
      } else {
        int a = arr[i - 1][j];
        int b = arr[i][j - 1];
        arr[i][j] = Math.max(a, b);
      }
    }
  }
  return arr[str1.length][str2.length];
}

```

### 穷举法

```java
一百个钱买一百只鸡，是个典型的穷举法应用。问题描述：每只大公鸡值 5 个钱，每只母鸡值 3 个钱，每 3 只小鸡值 1 个钱，现在有 100 个钱，想买 100 只鸡，问如何买？有多少种方法？
```

```java
public static void buy() {
  for (int i = 0; i <= 20; i++) {
    for (int j = 0; j <= 33; j++) {
      int k = 100 - i - j; //小鸡数量
      if (k % 3 == 0 && (5 * i + 3 * j + k / 3) == 100) {
        System.out.println("买法：" + i + "只公鸡，" + j + "只母鸡，" + k + "只小鸡");
      }
    }
  }
}
```


## 迭代和递推

### 求平发根（二分逼近法）
```java

  public static double sqrt(int num) {
    return dichotomyEquation(num, 2);
  }

  public static double dichotomyEquation(int num, int n) {
    double a = 0, b = num;
    double mid = (a + b) / 2.0;
    double PRECISION = 0.000000001;
    while (b - a > PRECISION) {
      if (fun(num, n, mid) < 0.0) {
        a = mid;
      } else {
        b = mid;
      }
      mid = (a + b) / 2.0;
    }
    return mid;
  }

  public static double fun(int num, int n, double x) {
    double res = 1.0;
    for (int i = 0; i < n; i++) {
      res = res * x;
    }
    return res - num;
  }


```

### 求平方根（牛顿迭代法）
```java

```

## 穷举搜索

### 装配线与工作站

### 三个水桶等分八升水

```java
有三个分别是 3 升、5 升和 8 升容积的水桶，其中容积为 8 升的水桶中装满了水，
容积为 3 升和容积为 5 升的水桶是空的，三个水桶都没有体积刻度。
现在需要把大水桶中的 8 升水等分成两份，每份都是 4 升水，
附加条件是只能使用这 8 升水和另外两个空水桶，不能借助其他容器或更多的水。
```

```java

```

## 动态规划


## 图论


## 游戏中的算法


## 算法与应用



