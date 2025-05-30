---
title: 经典排序算法之二 归并排序
categories: Big-Back-End
toc: true
comments: true
date: 2017-01-24 16:38:56
tags:
---


归并，是将两个已经排好序的数组合并为一个有序的数组。归并排序，采用了分治法，通过递归，将元素一层层分解开，直到不能分解了，再一层层左右比较后合并出一个有序数组。完整的代码可以到我的 GitHub 上查看 [Algorithm](https://github.com/mjd507/Algorithm)。

<!--more-->

##  算法描述
1. 对于数组 a[n], 找出其中间元素的角标 mid，并以此角标为界，将数组分为两边。
2. 对于每一半，继续分别找出其中间元素的角标 mid，继续以此角标划分，重复此步骤，直到不能再划分为止。
3. 将相邻的两个数字进行比较，然后归并到一个新数组中。此时每个序列包含两个元素。
4. 重复步骤 3，直到所有元素排序完毕。


## 算法图解

![Merge Sort](https://user-images.githubusercontent.com/8939151/111022690-5035a180-840f-11eb-8ae6-71c8af80afcc.png)

## 代码实现

```java
	public static void mergeSort(int[] arr, int first, int last, int[] temp){
		if(first < last){
			int mid = (first + last)/2;
			
			mergeSort(arr, first, mid, temp); //左边递归
			mergeSort(arr, mid + 1, last, temp); //右边递归

			int m = mid + 1;
			int k = first;
			while(first <= mid && m <= last){
				if(arr[first] < arr[m]){
					temp[k++] = arr[first++];
				}else {
					temp[k++] = arr[m++];
				}
			}
			while(first <= mid){
				temp[k++] = arr[first++];
			}
			while(m <= last){
				temp[k++] = arr[m++];
			}
			for (int i = 0; i < k; i++) {
				arr[i + first] = temp[i];
			}
		}
	}

```

## 效率分析

时间复杂度为 O(nlgn)

在我的机器上运行 10000 个元素排序，所用的时间为：

```
执行时间为：44ms
```

20000 个元素所用的时间

```
执行时间为：70ms
```

100000 个元素所用的时间

```
执行时间为：1496ms
```

与插入排序相比，归并排序在数据量越来越大时，有明显的优势。


## 非常棒的资料

[麻省理工学院公开课：算法导论](http://open.163.com/special/opencourse/algorithms.html)

[白话经典算法系列](http://blog.csdn.net/MoreWindows/article/category/859207)


