---
title: Linux 内核技术 - Page Cache 观测
categories: Big-Back-End
toc: true
comments: true
copyright: true
visible: true
date: 2020-12-27 16:25:29
tags:
---

Page Cache 管理不当，不仅会增加系统 I/O 吞吐，还会引起业务性能抖动，我们在工作中遇到的一些场景比如：

1. 机器 load 飚高
2. 机器 I/O 吞吐飚高
3. 业务响应时延出现较大的毛刺
4. 业务平均响应时延明显增加

这都很可能与 Page Cache 相关。

<!--more-->

## Page Cache 是什么

先来看张图：
![](https://static001.geekbang.org/resource/image/f3/1b/f344917f3cacd5bc06ae7c743a217f1b.png)

Page Cache 是内核管理的一块内存，不属于用户态。

如何观察Page Cache 呢？方式有很多，包括/proc/meminfo、free 、/proc/vmstat命令等，它们的内容其实是一致的。

我们以 /proc/meminfo 为例来看。less /proc/meminfo

```
...
Buffers:            9000 kB
Cached:           287204 kB
SwapCached:            0 kB
Active:           313512 kB
Inactive:         212828 kB
Active(anon):     225076 kB
Inactive(anon):     5924 kB
Active(file):      88436 kB
Inactive(file):   206904 kB
...
Shmem:               860 kB
...
```

根据上面数据，可以得到这样一个公式：

**Buffers + Cached + SwapCached  =  Active(file) + Inactive(file) + Shmem + SwapCached**

而等式两边就是 Page Cache 包括的内容。等式右边这些项把 Buffers 和 Cached 做了一下细分，分为了 Active(file)，Inactive(file) 和 Shmem，我们从等式右边来分析。

Active(file) + Inactive(file) 是 File-backed page（与文件对应的内存页），我们平时用的 mmap() 内存映射方式和 buffered I/O 来消耗的内存就属于这部分，最重要的是，这部分在真实的生产环境上最容易产生问题。

Shmem 是指匿名共享映射这种方式分配的内存（free 命令中 shared 这一项），比如 tmpfs（临时文件系统），这部分在真实的生产环境中产生的问题比较少。不过多关注。

SwapCached 是在打开了 Swap 分区后，把 Inactive(anon) + Active(anon) 这两项里的匿名页给交换到磁盘（swap out），然后再读入到内存（swap in）后分配的内存。由于读入到内存后原来的 Swap File还 在，所以 SwapCached 也可以认为是 File-backed page，即属于 Page Cache。这样做的目的也是为了减少I/O。

建议你在生产环境中关闭Swap分区，因为Swap过程产生的I/O会很容易引起性能抖动。

free 命令也可以查询 Page Cache，会根据 buff/cache 判断存在多少Page Cache。 free 命令也是通过解析 /proc/meminfo 得出这些统计数据，开源的 [procfs](https://gitlab.com/procps-ng/procps) free.c 源码文件可以看看。

```
sh-4.4# free -k
              total        used        free      shared  buff/cache   available
Mem:        2047132      276744     1453236         860      317152     1630316
Swap:       1048572           0     1048572
```

通过 procfs 源码里面的 proc/sysinfo.c 这个文件，你可以发现 buff/cache 包括下面这几项：

**buff/cache = Buffers + Cached + SReclaimablei**

ps: 在做比较的过程中，一定要考虑到这些数据是动态变化的，而且执行命令本身也会带来内存开销，所以这个等式未必会严格相等，不过你不必怀疑它的正确性。

buff/cache 是由 Buffers、Cached 和 SReclaimable 这三项组成的，它强调的是内存的可回收性，也就是说，可以被回收的内存会统计在这一项。其中 SReclaimable是 指可以被回收的内核内存，包括 dentry 和 inode 等，比较细节，不多说。

## 为什么需要Page Cache

我们看一个具体的例子。首先，我们来生成一个1G大小的新文件，然后把Page Cache清空，确保文件内容不在内存中，以此来比较第一次读文件和第二次读文件耗时的差异。具体的流程如下。

1. 先生成一个1G的文件：

    dd if=/dev/zero of=/home/dd.out bs=4096 count=$((1024*256))

2. 清空 Page Cache，需要先执行一下 sync 来将脏页同步到磁盘再去 drop cache。

    sync && echo 3 > /proc/sys/vm/drop_caches

3. 第一次读取文件的耗时如下

    ```
    sh-4.4# time cat /home/dd.out &> /dev/null

    real  0m1.774s
    user  0m0.020s
    sys 0m0.970s
    ```

4. 再次读取文件的耗时如下

    ```
    sh-4.4# time cat /home/dd.out &> /dev/null

    real  0m0.212s
    user  0m0.020s
    sys 0m0.180s
    ```

可以看到，第二次读取文件的耗时远小于第一次的耗时，这是因为第一次是从磁盘来读取的内容，磁盘I/O是比较耗时的，而第二次读取的时候由于文件内容已经在第一次读取时被读到内存了，所以是直接从内存读取的数据，内存相比磁盘速度是快很多的。这就是Page Cache存在的意义：减少I/O，提升应用的I/O速度。



