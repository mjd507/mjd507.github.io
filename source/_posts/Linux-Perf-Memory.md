---
title: Linux 性能优化 - 内存篇
categories: Big-Back-End
toc: true
comments: true
copyright: true
visible: true
date: 2021-03-03 10:41:19
tags:
---

本文参考极客时间付费课程，将众多 内存 相关的知识柔和成一篇，细节部分没有连贯，仅作为学习记录笔记。

<!--more-->

## 内存如何分配和工作

1. 对普通进程来说，能看到的就是内核提供的虚拟内存，这些虚拟内存通过页表，由系统映射为物理内存。

    (Linux 用四级页表来管理内存页，虚拟地址被分为 5 个部分，前 4 个表项用于选择页，而最后一个索引表示页内偏移。从而大大地减少页表的项数)

2. 当进程通过 malloc() 申请内存后，内存并不会立即分配，而是在首次访问时，才通过缺页异常陷入内核中分配内存。

    (内核空间分配物理内存、更新进程页表，最后再返回用户空间，恢复进程的运行)

3. 由于进程的虚拟地址空间比物理内存大很多，Linux 提供了一系列的机制，应对内存不足的问题，比如缓存的回收、交换分区 Swap 以及 OOM 等。


## Buffer 和 Cache 

free 命令中，输出了 buffers 和 cache，从 man 手册中看下它是如何描述的。

```txt
       buffers
              Memory used by kernel buffers (Buffers in /proc/meminfo)

       cache  Memory used by the page cache and slabs (Cached and SReclaimable in /proc/meminfo)

```
Buffers 是内核缓冲区用到的内存，对应的是 /proc/meminfo 中的 Buffers 值。Cache 是内核页缓存和 Slab 用到的内存，对应的是 /proc/meminfo 中的 Cached 与 SReclaimable 之和。

/proc 是 Linux 内核提供的一种特殊文件系统，是用户跟内核交互的接口。

继续通过 man proc，搜索 meminfo，定位文档如何描述。

```txt
              Buffers %lu
                     Relatively temporary storage for raw disk blocks that shouldn't get tremendously large (20MB or so).

              Cached %lu
                     In-memory cache for files read from the disk (the page cache).  Doesn't include SwapCached.
		
	      ...

              SReclaimable %lu (since Linux 2.6.19)
                     Part of Slab, that might be reclaimed, such as caches.

              SUnreclaim %lu (since Linux 2.6.19)
                     Part of Slab, that cannot be reclaimed on memory pressure.

```

Buffers 是对原始磁盘块的临时存储，也就是用来缓存磁盘的数据，通常不会特别大（20MB 左右）。这样，内核就可以把分散的写集中起来，统一优化磁盘的写入，比如可以把多次小的写合并成单次大的写等等。

Cached 是从磁盘读取文件的页缓存，也就是用来缓存从文件读取的数据。这样，下次访问这些文件数据时，就可以直接从内存中快速获取，而不需要再次访问缓慢的磁盘。

SReclaimable 是 Slab 的一部分。Slab 包括两部分，其中的可回收部分，用 SReclaimable 记录；而不可回收部分，用 SUnreclaim 记录。

通过实验，可以得出上面描述并不完整。

- Buffer 既可以用作“将要写入磁盘数据的缓存”，也可以用作“从磁盘读取数据的缓存”。
- Cache 既可以用作“从文件读取数据的页缓存”，也可以用作“写文件的页缓存”。


## 缓存命中率

介绍两个工具，cachestat 和 cachetop，都是 bcc 软件包的一部分，它们基于 Linux 内核的 eBPF（extended Berkeley Packet Filters）机制，来跟踪内核中管理的缓存，并输出缓存的使用和命中情况。

- cachestat 提供了整个操作系统缓存的读写命中情况。
- cachetop 提供了每个进程的缓存命中情况。

## 内存泄漏

用户空间内存包括多个不同的内存段，比如只读段、数据段、堆、栈以及文件映射段等。这些内存段正是应用程序使用内存的基本方式。

- 只读段，包括程序的代码和常量，由于是只读的，不会再去分配新的内存，所以也不会产生内存泄漏。
- 数据段，包括全局变量和静态变量，这些变量在定义时就已经确定了大小，所以也不会产生内存泄漏。
- 内存映射段，包括动态链接库和共享内存，其中共享内存由程序动态分配和管理。所以，如果程序在分配后忘了回收，就会导致跟堆内存类似的泄漏问题。

vmstat 可以观察 free 列内存的变化，但如何定位到具体的具体的进程和具体的方法呢？

介绍一个内存泄漏检测工具，memleak。memleak 可以跟踪系统或指定进程的内存分配、释放请求，然后定期输出一个未释放内存和相应调用栈的汇总情况（默认 5 秒）。memleak 也是 bcc 软件包中的一个工具。

`/usr/share/bcc/tools/memleak -p $(pidof app) -a`

## Swap 分区内存

在内存资源紧张时，Linux 通过直接内存回收和定期扫描的方式，来释放文件页和匿名页，以便把内存分配给更需要的进程使用。

- 文件页的回收比较容易理解，直接清空，或者把脏数据写回磁盘后再释放。
- 而对匿名页的回收，需要通过 Swap 换出到磁盘中，下次访问时，再从磁盘换入到内存中。

可以设置 /proc/sys/vm/min_free_kbytes，来调整系统定期回收内存的阈值（也就是页低阈值），还可以设置 /proc/sys/vm/swappiness，来调整文件页和匿名页的回收倾向。

## 整理分析内存问题的思路

![性能指标](https://static001.geekbang.org/resource/image/e2/36/e28cf90f0b137574bca170984d1e6736.png)

![](https://static001.geekbang.org/resource/image/8f/ed/8f477035fc4348a1f80bde3117a7dfed.png)

为了迅速定位内存问题，通常会先运行几个覆盖面比较大的性能工具，比如 free、top、vmstat、pidstat 等。

1. 先用 free 和 top，查看系统整体的内存使用情况。
2. 再用 vmstat 和 pidstat，查看一段时间的趋势，从而判断出内存问题的类型。
3. 最后进行详细分析，比如内存分配分析、缓存 / 缓冲区分析、具体进程的内存使用分析等。

![](https://static001.geekbang.org/resource/image/d7/fe/d79cd017f0c90b84a36e70a3c5dccffe.png)

