---
title: 插入排序
categories: Algorithm
toc: true
comments: true
date: 2017-01-21 09:05:44
tags:
---

插入排序，简单来说，就是将一组数据一个一个地插入到已经排好序的数组中，从而形成一个有序数组。

<!--more-->

##  算法描述

1. 对于数组 a[n] ，默认 a[0] 已经被排序，a[1] ~ a[n-1]无序。令 i = 0； j = i + 1。
2. 取出 j 位置的值 a[ j ] ，在已排好的元素中，从后向前依次与 a[ j ] 比较，如果该元素 a[ j - 1]  > a [ j ]，则将 a[ j - 1] 移到 j 的位置，同时 j —。一次遍历结束后，可以向已排好的数组中插入一个元素，i ++。
3. 重复步骤 2，直到 i = n -1。

## 算法图解

![Insertion Sort](/images/Algorithm/InsertionSort.png)

## 代码实现

```java
    public static void insertSort(int[] arr){
        for(int i = 0; i < arr.length - 1; i ++){
            //取出 j 位置的值，与已经排好的数组元素依次比较，从后往前比较
            for(int j = i + 1; j > 0; j --){
                if(arr[j-1] > arr [j]){
                    int temp = arr[j-1];
                    arr[j-1] = arr[j];
                    arr[j] = temp;
                }else{ //避免无用遍历
                    break;
                }
          }
          //至此一个循环，完成了一个元素的插入
        }
    }
```

## 效率分析

这里最坏的情况，即 每次遍历都要重新排序，时间复杂度为 O(n²)。

在我的机器上运行 10000 个元素排序，所用的时间为：

```
执行时间为：47ms
```

20000 个元素所用的时间

```
执行时间为：180ms
```

100000 个元素所用的时间

```
执行时间为：4261ms
```

可见 插入排序 在数据越来越大时，执行时间也明显的变多。



## 非常棒的资料

[麻省理工学院公开课：算法导论](http://open.163.com/special/opencourse/algorithms.html)

[白话经典算法系列](http://blog.csdn.net/MoreWindows/article/category/859207)



<br /><br /><br />

<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/"><img alt="知识共享许可协议" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-nd/3.0/cn/88x31.png" /></a><br />本作品采用<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/">知识共享署名-非商业性使用-禁止演绎 3.0 中国大陆许可协议</a>进行许可。