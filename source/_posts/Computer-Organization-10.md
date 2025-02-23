---
title: 计算机组成原理 - 理解 IO_WAIT
categories: Big-Back-End
toc: false
comments: true
copyright: true
visible: true
date: 2020-12-05 16:25:29
tags:
---

因为 CPU 的频率通常在 2GHz 以上，即每秒可执行 20 亿次操作，所以瓶颈通常在 I/O 上。那么具体如何定位呢？

<!--more-->

## IO_WAIT

- top

```shell
Tasks:   9 total,   1 running,   8 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.7 us,  0.8 sy,  0.0 ni, 98.5 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   1999.2 total,   1018.3 free,    299.8 used,    681.1 buff/cache
MiB Swap:   1024.0 total,   1024.0 free,      0.0 used.   1542.5 avail Mem
...
```
有一行是以 %CPU 开头的。这一行里，有一个叫作 wa 的指标，这个指标就代表着 iowait，也就是 CPU 等待 IO 完成操作花费的时间占 CPU 的百分比。

如果 wa 值比较大，我们就可以通过 iostat 命令，看实际的硬盘读写情况。

- iostat

```shell
avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           1.24    0.00    0.35    0.01    0.00   98.40

Device             tps    kB_read/s    kB_wrtn/s    kB_read    kB_wrtn
sda               0.43         4.33       926.54     303883   65000912
scd0              0.04         2.59         0.00     182018          0
scd1              0.00         0.00         0.00        176          0
scd2              0.02         1.41         0.00      99268          0
```

这里的tps，就是的硬盘的IOPS（每秒读写的次数）性能。而kB_read/s和kB_wrtn/s，就是我们的数据传输率的指标。

知道实际硬盘读写的tps、kB_read/s和kb_wrtn/s的指标，我们基本上可以判断出，机器的性能是不是卡在I/O上了。

接下来，我们需要确定，哪一个进程占用了大量 I/O。

- iotop

```shell
Total DISK READ :       0.00 B/s | Total DISK WRITE :      15.75 K/s
Actual DISK READ:       0.00 B/s | Actual DISK WRITE:      35.44 K/s
  TID  PRIO  USER     DISK READ  DISK WRITE  SWAPIN     IO>    COMMAND                                             
  104 be/3 root        0.00 B/s    7.88 K/s  0.00 %  0.18 % [jbd2/sda1-8]
  383 be/4 root        0.00 B/s    3.94 K/s  0.00 %  0.00 % rsyslogd -n [rs:main Q:Reg]
```

------

接下来，借助 stress 命令，模拟一个高I/O负载的情况。

```shell
stress -i 2 // 让stress这个程序模拟两个进程不停地从内存里往硬盘上写数据。
```

top
```shell
top - 09:17:02 up 20:04,  0 users,  load average: 1.41, 0.43, 0.15
Tasks:  13 total,   3 running,  10 sleeping,   0 stopped,   0 zombie
%Cpu(s):  1.1 us, 23.5 sy,  0.0 ni, 34.7 id, 37.7 wa,  0.0 hi,  3.0 si,  0.0 st
MiB Mem :   1999.2 total,    979.4 free,    301.6 used,    718.2 buff/cache
MiB Swap:   1024.0 total,   1024.0 free,      0.0 used.   1537.7 avail Mem
```
你会看到，在top的输出里面，CPU就有大量的sy和wa，也就是系统调用和iowait。

iostat 2 5
```shell
avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           0.38    0.00   34.87   46.36    0.00   18.39

Device             tps    kB_read/s    kB_wrtn/s    kB_read    kB_wrtn
sda            2782.00         0.00         0.00          0          0
scd0              0.00         0.00         0.00          0          0
scd1              0.00         0.00         0.00          0          0
scd2              0.00         0.00         0.00          0          0
```
查看硬盘的I/O，里面的tps 也很高。

这个时候我们去看一看iotop，你就会发现，我们的I/O占用，都来自于stress产生的两个进程了。

iotop
```shell
Total DISK READ :       0.00 B/s | Total DISK WRITE :       0.00 B/s
Actual DISK READ:       0.00 B/s | Actual DISK WRITE:       0.00 B/s
  TID  PRIO  UID     DISK READ  DISK WRITE  SWAPIN     IO>    COMMAND                                             
29161 be/4   0    0.00 B/s    0.00 B/s  0.00 % 56.71 % stress -i 2
29162 be/4   0    0.00 B/s    0.00 B/s  0.00 % 46.89 % stress -i 2
```

stress 除了模拟 io, 还可以模拟多核cpu竞争，内存分配等场景。





