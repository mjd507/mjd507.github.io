---
title: TCP/IP 协议入门（一）
categories: 网络相关
toc: true
comments: true
copyright: true
date: 2018-01-06 22:00:01
tags:
---

教科书上把网络通信协议 OSI（Open System Interconnection）参考模型分成了 7 层，这 7 层模型撑起了网络通信的骨架，是一个理想的模型，而 TCP/IP 协议大致上实现了这种骨架，相比 OSI模型， TCP/IP 更加实用，因此在互联网众多通信协议中最为著名，有人把 TCP/IP 协议分为 4 层，有人分为 5 层，我认为划分为 5 层，更容易理解。

<!--more-->

## OSI  & TCP/IP 协议模型

下面表格展示了 OSI 7 层参考模型 与 TCP/IP 协议 5 层模型的对比，以及每层所定义的一些协议。

| OSI 7 层模型               | TCP/IP 模型              | 协议                        |
| :---------------------- | :--------------------- | ------------------------- |
| 应用层（Application Layer）  | 应用层（Application Layer） | HTTP, FTP, SMTP, POP3 ... |
| 表示层（Presentation Layer） |                        |                           |
| 会话层（Session Layer）      |                        |                           |
| 传输层（Transport Layer）    | 传输层（Transport Layer）   | TCP, UDP                  |
| 网络层（Networking Layer）   | 网络层（Networking Layer）  | IP，ARP, ICMP              |
| 数据链路层（Datalink Layer）   | 数据链路层（Datalink Layer）  | 以太网, 无线通信, PPP...         |
| 物理层（Physical Layer）     | 物理层（Physical Layer）    |                           |

简单解释一下**协议**：它是事先达成的一种「约定」，是计算机与计算机之间通过网络实现通信时，必须遵循这一约定的规范。

层与层之间通过接口进行通信。发送端数据从应用层开始，一层一层向下传输，接收端，从物理层开始，向上一层一层解析获得数据。



## 物理层

TCP/IP 对于物理层并没有作出定义，因此，有些地方将物理层与数据链路层划分在一层，即数据链路和物理层。

这里按照 OSI 的参考模型解释一下物理层，负责从源设备的物理层到目标设备的物理层的数据的最终传输。传输方式可以是电缆，光纤，无线等网络通信媒介。

通信媒介之间处理的是电压的高低，光的闪灭以及电波的强弱等信号，而计算机是以二进制 0 1 来表示信息，物理层的作用就是将信号与二进制数据进行互转。



## 数据链路层

数据链路层的协议定义了互连设备之间数据传输规范。该层处理的数据不是单纯的 0 1 序列，而是把它们组合为一个叫「帧」的块，再交给物理层传输。

### 以太网

以太网是众多数据链路中，使用比较广泛的一种。其「帧」个格式包含：以太网首部，数据包和尾部。首部又包含目标 Mac 地址，源 Mac 地址，上层协议类型。数据包能容纳的数据范围为 46 ~ 1500 个字节。帧尾是一个 FCS （帧检验序列），占 4 个字节。

![以太网帧结构](/images/TCP-IP/link_frame_ytw.png)

在总线型与环路型网络中，以太网发送数据，是发向本网络所有的主机中，让每台主机自己去判断，是否为接受方。判断的依据就是自己的 Mac 地址与接受到的 Mac 地址是否相同。

### 无线通信

无线通信现在用的也很多，典型的就是现在手机的移动通信网络，简单介绍一下，跟以太网类似，也采用 Mac 地址来寻找主机，不过是通过基站的方式实现通信，其物理层使用电磁波或红外线来传输数据。



## 网络层

IP（Internet Protocol）层即网络层，它的作用是实现了主机与主机之间点对点的通信。数据链路层的作用是在互连同一种数据链路的节点直接进行包传递，而一旦跨越多种数据链路，就需要借助网络层。

网络层与数据链路层的关系。就像旅行时的行程表和火车票。每一张票只负责特地区间的运输，而行程表指导了运输的方向。

![点对点通信](/images/TCP-IP/ip_and_link.png)

### 路由控制

IP 之所以能点对点通信，靠的是路由控制。IP 数据在每个区间内，采用「跳」的方式传递，每跳到一个路由器上，就会去查询路由控制表，找出下一次要跳转的路由器地址，直至到达目标地址。

### 无连接

IP 面向无连接。即在发包之前，不需要建立与对端目标地址之间的连接。上层如果有发送给 IP 的数据，会立即被 IP 包发送出去。

这样的好处有两个，一是简化，二是提速。面向连接比无连接相对复杂，管理每个连接本身就是一个很繁琐的事；如果每次通信都要建立连接，会降低处理速度。需要有连接时，可以委托给上层提供此服务。

事实上，上一层的 TCP 确实是面向有连接。



## 传输层
