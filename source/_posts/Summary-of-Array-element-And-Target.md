---
title: 两数三数四数求和问题总结
categories: Data Structure & Algorithm
toc: true
comments: true
copyright: true
date: 2017-07-22 15:03:20
tags:
---

 LeetCode 刷了近 20 道题了，对于我来说，还是有一定的难度的，为了对题目类型及思路有个整体的把握，今天回头看了看这些题目，发现还有很很多相似的地方的，本篇就整理一下，前二十道出现频率最高的求和问题。比如：两数之和等于目标值；三数之和最接近目标值；三数之和为零；四数之和为零。

<!--more-->

## 通用思想

- 先对数组排序


- 对于两数，遍历数组，先确定一个数，再从剩下的元素中，从后往前遍历，找到与之之和等于目标值的数
- 对于三数之和为零，遍历数组，先确定一个数，再从剩下的元素中，找出两个数，使这三数之和为零，找到这两个数的方法， 参考上一条。
- 对于四叔之和为零，遍历数组，先确定一个数，再从剩下的元素中，找出三个数，使这四数之和为零，找到这三个数的方法， 参考上一条。
- 对于三数之和最接近目标值，与三数之和类似。不同的是，在每次遍历求和时，记录最接近的值。



## 关于排序

Java 里面其实给我们提供好了一个方法  `Arrays.sort(int[] arr)` ，我们可以直接用，但是我本人强烈建议，对于排序算法不熟悉的，可以暂时不用 JDK 提供的，而是去自己实现，尤其是快速排序和归并排序，很多的算法题都需要都需要先排序，借这个可以反复测验的机会，可以极大锻炼我们手写排序算法的能力。

之前也写过几篇文章，介绍几种排序算法，[插入排序](https://mjd507.github.io/2017/01/21/Algorithm-Insertion-Sort/)，[归并排序](https://mjd507.github.io/2017/01/25/Algorithm-Merge-Sort/)，[快速排序](https://mjd507.github.io/2017/02/07/Algorithm-Quick-Sort/)，也希望能帮助大家理解。



## 两数求和（TwoSum）

题目的意思是：找出两个数之和等于目标值的两个数的角标，所以，这里是不可以给元素排序的。根据前面的通用的思想，很容易写出下面的算法。

```java
    public static int[] twoSum(int[] nums, int target) {
        int len = nums.length;
        for (int i = 0; i < len; i++) {
            int end = len - 1;
            while (i < end) {
                int delta = nums[i] + nums[end] - target;
                if (delta != 0) {
                    end--;
                } else {
                    System.out.println(i + "" + end);
                    return new int[]{i, end};
                }
            }
        }
        return new int[]{0, 0};
    }
```

该算法时间复杂度为 O(n²)，空间复杂度为 O(1)。网上还有一种采用 HashMap 实现的方法。时间复杂度为 O(n)，空间复杂度也为 O(n)。

```java
    public static int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> map = new HashMap<Integer, Integer>();
        int result[] = new int[2];
        for (int i = 0; i < nums.length; i++) {
            if (map.containsKey(target - nums[i])) {
                result[0] = map.get(target - nums[i]);
                result[1] = i;
            } else {
                map.put(nums[i], i);
            }
        }
        return result;
    }

```



## 三数之和（3Sum）

将数组中三个数之和为零的所有组合找出放进集合中，不允许有重复的组合。采用通用的思想，时间复杂度为 O(n²)，每次遍历，都跳过已经遍历过得元素，从而避免重复。

```java
    public static List<List<Integer>> threeSum(int[] nums) {
        int len = nums.length;
        quickSort(nums, 0, len - 1);

        List<List<Integer>> list = new ArrayList<>();
        if (len < 3) return list;
        for (int i = 0; i < len - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) {
                continue;
            }
            int start = i + 1, end = len - 1;
            while (start < end) {
                int sum = nums[i] + nums[end] + nums[start];
                if (sum > 0) {
                    end--;
                } else if (sum < 0) {
                    start++;
                } else {
                    List<Integer> zero = new ArrayList<>();
                    zero.add(nums[i]);
                    zero.add(nums[start]);
                    zero.add(nums[end]);
                    list.add(zero);
                    start++;
                    end--;
                    while (start < end && nums[start] == nums[start - 1]) {
                        start++;
                    }
                    while (start < end && nums[end] == nums[end + 1]) {
                        end--;
                    }
                }
            }
        }
        return list;
    }

```





## 四数之和（4Sum）

在三数之和的基础上，在外面又包了一层遍历，其时间复杂度为 O(n³)。

```java
public static List<List<Integer>> fourSum(int[] nums, int target) {
        int len = nums.length;
        mergeSort(nums, 0, len - 1, new int[len]);
        List<List<Integer>> list = new ArrayList<>();
        if (len < 4) return list;
        for (int i = 0; i < len - 3; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) {
                continue;
            }
            for (int j = i + 1; j < len - 2; j++) {
                if (j > i + 1 && nums[j] == nums[j - 1]) {
                    continue;
                }
                int m = j + 1, n = len - 1;
                while (m < n) {
                    int sum = nums[i] + nums[j] + nums[m] + nums[n];
                    if (sum < target) {
                        m++;
                    } else if (sum > target) {
                        n--;
                    } else {
                        List<Integer> l = new ArrayList<>();
                        l.add(nums[i]);
                        l.add(nums[j]);
                        l.add(nums[m]);
                        l.add(nums[n]);
                        list.add(l);
                        m++;
                        n--;
                        while (m < n && nums[m] == nums[m - 1]) {
                            m++;
                        }
                        while (m < n && nums[n] == nums[n + 1]) {
                            n--;
                        }
                    }
                }
            }
        }
        return list;
    }
```



看到这，你就会发现，都是一个模子，思想都是一样的，没错，这也加强了我们的一个意识，如果遇到五个数，六个数，那么都可以采用这个思想来解决问题。