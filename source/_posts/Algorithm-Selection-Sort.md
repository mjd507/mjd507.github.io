---
title: 经典排序算法之五 选择排序
categories: Data Structure & Algorithm
toc: true
comments: true
copyright: true
date: 2017-04-02 13:41:08
tags:
---

选择排序，即选一个数，与其余的数一一比较，将小的数放在最前面，这样一次一次比较的过程中，逐步将最小的排到最前面。完整的代码可以到我的 GitHub 上查看 [Algorithm](https://github.com/mjd507/Algorithm)。

<!--more-->

## 算法描述

1. 对于数组 a[n]，其长度为 len，另 i = 0，j = i+1，比较 a[i] 与 a[j]，并将 a[i] 赋与较小的值，j++；
2. 当 j < len，重复操作步骤 1 的比较操作，循环结束后，确立了一个最小值；
3. 当 i < len - 1 ，重复 步骤 1、步骤2，直到数组排序完成。

## 算法图解

![SelectionSort](/images/Algorithm/SelectionSort.png)

## 代码实现

```java
	public static void selectionSort(int[] arr){
		int len = arr.length;
		for (int i = 0; i < len - 1; i++) {
			for (int j = i + 1; j < len; j++) { 
				if(arr[i] > arr[j]){
					int temp = arr[i];
					arr[i] = arr[j];
					arr[j] = temp;
				}
			}
			//j 完整遍历一次，确认一个最小值
		}
	}

```



## 效率分析

当所有元素都已经由小到大排好时，仍然要依次比较，时间复杂度为 O(n²)；

当所有元素都从大到小排列时， 除了比较，还要交换移位操作，最终时间复杂度也是  O(n²)。

在我的机器上运行 10000 个元素排序，所用的时间为：

```
执行时间为：196ms
```

20000 个元素所用的时间

```
执行时间为：771ms
```

100000 个元素所用的时间

```
执行时间为：18782ms
```



选择排序的效率跟冒泡排序差不多，数据比较多时，不建议此排序。



