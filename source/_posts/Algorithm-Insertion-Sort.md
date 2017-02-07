---
title: 经典排序算法之一 插入排序
categories: Algorithm
toc: true
comments: true
date: 2017-01-21 09:05:44
tags:
---

插入排序，简单来说，就是将一组数据一个一个地插入到已经排好序的数组中，从而形成一个有序数组。完整的代码可以到我的 GitHub 上查看 [Algorithm](https://github.com/mjd507/Algorithm)。

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

最好的情况是所有元素都已经由小到大排好了，比较次数为（n - 1）次，时间复杂度为 O(n);
最坏的情况，即所有元素都按降序排好了，比较次数为 1+2+3+..+ (n-1) = n(n-1)/2，移位次数为 比较次数 + (n-1) 次 ，时间复杂度为 O(n²)。

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

## 二分法插入排序

上面的方法取出待排序的元素之后，从已排好的元素中，从后往前依次比较，这里可以使用二分查找的方法，找出该元素应该插入的位置 index，然后将 index 之后的元素统一向后移位。

```java

    public static void insertSortBinarySearch(int[] arr){
        //System.out.println(Arrays.toString(arr));
        for(int i = 0; i < arr.length - 1; i ++){
            int index = findIndex(arr, 0, i, arr[i+1]);
            //System.out.println("insert pos = "+ index);
            int temp = arr[i+1];
            for (int j = i+1; j > index; j--) {
                arr[j] = arr[j-1];
            }
            arr[index] = temp;
            //System.out.println("iter result = "+Arrays.toString(arr));
        }
    }

    public static int findIndex(int[] arr, int first, int last, int value){
        int mid = -1;
        int index = -1;
        while(first <= last){
            mid = (first + last)/2;
            if(value == arr[mid]){ 
                index = mid;
                return index;
            }
            if(value < arr[mid]){ //left
                last = mid - 1;
            }else{ //right
                first = mid + 1;
            }
        }
        //no match value, find the closer index
        if(value < arr[mid]){
            index = mid;
        }else{
            index = mid + 1;
        }
        return index;

    }

```


二分查找最好情况是：每次查找的位置是已排数组元素的最后一个的下一个，此时无须进行向后移位操作，比较次数为 lgn。时间复杂度为 O(lgn)。

二分查找最坏情况是：每次查找的位置是已排数组元素的第一个位置，此时移位次数为：n(n-1)/2 + (n-1)，比较次数仍为 lgn。时间复杂度为 O(n²)。

使用二分法插入排序，在我的机器上运行 10000 个元素排序，所用的时间为：

```
执行时间为：22ms
```

20000 个元素所用的时间

```
执行时间为：56ms
```

100000 个元素所用的时间

```
执行时间为：1255ms
```

可以看出，二分法插入排序在效率上还是要高出不少。而且，直接插入排序与二分插入排序的空间复杂度都是 O(1)。


## 非常棒的资料

[麻省理工学院公开课：算法导论](http://open.163.com/special/opencourse/algorithms.html)

[白话经典算法系列](http://blog.csdn.net/MoreWindows/article/category/859207)



<br /><br /><br />

<center>
<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/"><img alt="知识共享许可协议" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-nd/3.0/cn/88x31.png" /></a><br />
本作品采用 <a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/">知识共享署名-非商业性使用-禁止演绎 3.0 中国大陆许可协议</a> 进行许可。
</center>
