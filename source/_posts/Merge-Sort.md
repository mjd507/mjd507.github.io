---
title: 归并排序
categories: Algorithm
toc: true
comments: true
date: 2017-01-24 16:38:56
tags:
---


归并，是将两个已经排好序的数组合并为一个有序的数组。归并排序，采用了分治法，通过递归，将元素一层层分解开，直到不能分解了，再一层层左右比较后合并出一个有序数组。

<!--more-->

##  算法描述
1. 对于数组 a[n], 找出其中间元素的角标 mid，并以此角标为界，将数组分为两边。
2. 对于每一半，继续分别找出其中间元素的角标 mid，继续以此角标划分，重复此步骤，直到不能再划分为止。
3. 将相邻的两个数字进行比较，然后归并到一个新数组中。此时每个序列包含两个元素。
4. 重复步骤 3，直到所有元素排序完毕。


## 算法图解

![Merge Sort](/images/Algorithm/MergeSort.png)

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
				arr[i] = temp[i];
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


<br /><br /><br />

<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/"><img alt="知识共享许可协议" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-nd/3.0/cn/88x31.png" /></a><br />本作品采用<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/">知识共享署名-非商业性使用-禁止演绎 3.0 中国大陆许可协议</a>进行许可。