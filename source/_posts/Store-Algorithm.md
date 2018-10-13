---
title: 算法储备
categories: Algorithm
toc: true
comments: true
copyright: true
visible: true
date: 2018-10-14 00:24:16
tags:
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


## 迭代和递推


## 穷举搜索


## 动态规划


## 图论


## 游戏中的算法


## 算法与应用



