---
title: 计算机组成原理 - 性能和功耗
categories: Operation System
toc: true
comments: true
copyright: true
visible: true
date: 2020-10-08 16:25:29
tags:
---

什么是性能？我们一般这样定义：

```txt
性能 = 1 / 响应时间
```

除了响应时间，吞吐率也是衡量性能的一个指标。一般通过 CPU 的多核，或者水平增加机器来提示吞吐率，从而提高单位时间的任务处理速度。

<!--more-->


## CPU 时钟

Linux 下有一个 time 命令，可统计程序在 CPU 上到底花了多少时间。

```shell
➜  ~ time seq 100000 | wc -l
  100000
seq 100000  0.04s user 0.00s system 89% cpu 0.054 total
wc -l  0.00s user 0.00s system 10% cpu 0.052 total
```
total 即整个过程花的时间(Wall Clock Time)
user 即 cpu 运行程序，用户态的时间
system 即 cpu 运行程序，内核态的时间

由于 CPU 执行过程中不停的切换，可能中途去执行别的程序了，或者读取网络或磁盘数据，导致 CPU 时钟并不能准确反映程序的执行时间。

我们可以进一步拆解程序 CPU 执行时间。
```txt
程序的 CPU 执行时间 = CPU 时钟周期数 × 时钟周期时间
```
时钟周期时间，即 CPU 主频，比如我的电脑为 2.8GHz，可以先粗浅地认为，CPU 在 1 秒时间内，可以执行的简单指令的数量是 2.8G 条。这个数值越大，表示 CPU 性能越强。

CPU 时钟周期数，即 指令数 x 每条指令的平均时钟周期数(CPI)。

以上公式，继续拆解
```txt
程序的 CPU 执行时间 = 指令数×CPI×Clock Cycle Time
```

所以性能优化，主要三个地方

1. 硬件方面，提高 CPU 主频
2. 减少每条指令的平均时钟周期数(CPI)
3. 减少指令数


## 功耗

CPU 主频是不是越高越好呢？

当然不是，提升主频，会增加功耗，带来耗电和散热问题。Intel i9 CPU 的主频配置也只不过是 5GHz 而已。

一旦功耗增加过多，CPU 散热跟不上，这时就需要降低电压，5GHz 主频的 Intel i9，CPU 的电压只有 1V 左右。




