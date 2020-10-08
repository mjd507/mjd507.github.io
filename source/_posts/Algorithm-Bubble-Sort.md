---
title: 经典排序算法之四 冒泡排序
categories: Data Structure & Algorithm
toc: true
comments: true
copyright: true
date: 2017-03-31 20:27:21
tags:
---

冒泡，即像气泡一样一层一层往上冒，冒泡排序就是相邻两个数比较，大的数往后移，这样一次一次往后移的过程中，逐步将最大的排到右边，形成一个有序的数组。完整的代码可以到我的 GitHub 上查看 [Algorithm](https://github.com/mjd507/Algorithm)。

<!--more-->

## 算法描述

1. 对于数组 a[n]，其长度为 len，另 j = 0，比较 a[j] 与 a[j+1]，并将 a[j+1] 赋与较大的值，j++；
2. 当 j < len - 1，重复操作步骤 1，循环结束后，确立了一个最大值；
3. 另 i = 1，当 i < len ，重复 步骤 1、步骤2，直到数组排序完成。



## 算法图解

![BubbleSort](/images/Algorithm/BubbleSort.png)

## 代码实现

```java
	public static void bubbleSort(int[] arr){
		int len = arr.length;
		for (int i = 1; i < len; i++) {
			for (int j = 0; j < len - i; j++) {
				if(arr[j] > arr[j+1]){
					int temp = arr[j];
					arr[j] = arr[j+1];
					arr[j+1] = temp;
				}
			}
			//j 完整遍历一次，确认一个最大值
		}
	}

```



## 效率分析

当所有元素都已经由小到大排好时，仍然要依次比较，时间复杂度为 O(n²)；

当所有元素都从大到小排列时， 除了比较，还要交换移位操作，最终时间复杂度也是  O(n²)。

在我的机器上运行 10000 个元素排序，所用的时间为：

```
执行时间为：195ms
```

20000 个元素所用的时间

```
执行时间为：809ms
```

100000 个元素所用的时间

```
执行时间为：19495ms
```



冒泡排序的效率非常之低，当数据很多时，排序时间明显增多。



