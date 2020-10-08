---
title: 经典排序算法之三 快速排序
categories: Data Structure & Algorithm
toc: true
comments: true
date: 2017-02-06 17:24:48
tags:
---

快速排序是一种效率很高的排序方法，其采用了一种分治的策略。比起归并排序，快速排序是 “in place”的比较，所以没有多余的空间内存占用，CSDN 上 有人概括其为 [“挖坑填数+分治法”](http://blog.csdn.net/morewindows/article/details/6684558)，非常推荐去看一看。完整的代码可以到我的 GitHub 上查看 [Algorithm](https://github.com/mjd507/Algorithm)。

<!--more-->

## 算法描述
1. 对于数组 a[n], 设 start = 0，end = n-1，取 a[start] 的值，赋给 key 变量，即 key = a[start]。
2. 从 end 开始，从后向前找第一个小于 key 的数 ，令 a[start] = a[end] ，此时 end 留出一个坑位，继续下一步。
3. 从 start 开始，从前向后找第一个大于 key 的数，令 a[end] = a[start] ，此时 end 的坑位补上了，start 留出一个坑位。
4. 重复 步骤2、步骤3，直到 start == end, 循环结束，给最后一个坑位赋值 key，排序完成。


## 算法图解

![Quick Sort](/images/Algorithm/QuickSort.png)


## 代码实现

```java

	public static void quickSort(int arr[], int start, int end){
		if(start < end){
			int startIndex = start, endIndex = end, key = arr[start];
			while(start < end){

				// 从后向前找第一个小于 key 的数  
				while(start < end && arr[end] > key){
					end--;
				}
				if(start < end){
					arr[start] = arr[end];
					start++;
				}

				// 从前向后找第一个大于 key 的数  
				while(start < end && arr[start] < key){
					start++;
				}
				if(start < end){
					arr[end] = arr[start];
					end--;
				}
			
			}

			//start == end
			int keyIndex = start;
			arr[keyIndex] = key;

			quickSort(arr, startIndex, keyIndex - 1);
			quickSort(arr, keyIndex + 1, endIndex);

		}

	}

```

## 效率分析

时间复杂度最好为 O(nlgn)，最差为 O(nlgn)，平均为 O(nlgn)。


在我的机器上运行 10000 个元素排序，所用的时间为：

```
执行时间为：2ms
```

20000 个元素所用的时间

```
执行时间为：5ms
```

100000 个元素所用的时间

```
执行时间为：24ms
```

可见，快速排序的速度还是相当的快的。


