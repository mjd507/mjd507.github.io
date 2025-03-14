---
title: TCP/IP 协议入门
categories: Big-Back-End
toc: false
comments: true
copyright: true
date: 2018-01-06 22:00:01
tags:
---

教科书上把网络通信协议 OSI（Open System Interconnection）参考模型分成了 7 层，这 7 层模型撑起了网络通信的骨架，是一个理想的模型，而 TCP/IP 协议大致上实现了这种骨架，相比 OSI模型， TCP/IP 更加实用，因此在互联网众多通信协议中最为著名，有人把 TCP/IP 协议分为 4 层，有人分为 5 层，我认为划分为 5 层，更容易理解。

<!--more-->

## 1. OSI  & TCP/IP 协议模型

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



## 2. 物理层

TCP/IP 对于物理层并没有作出定义，因此，有些地方将物理层与数据链路层划分在一层，即数据链路和物理层。

这里按照 OSI 的参考模型解释一下物理层，负责从源设备的物理层到目标设备的物理层的数据的最终传输。传输方式可以是电缆，光纤，无线等网络通信媒介。

通信媒介之间处理的是电压的高低，光的闪灭以及电波的强弱等信号，而计算机是以二进制 0 1 来表示信息，物理层的作用就是将信号与二进制数据进行互转。



## 3. 数据链路层

数据链路层的协议定义了互连设备之间数据传输规范。该层处理的数据不是单纯的 0 1 序列，而是把它们组合为一个叫「帧」的块，再交给物理层传输。

### 3.1 以太网

以太网是众多数据链路中，使用比较广泛的一种。其「帧」个格式包含：以太网首部，数据包和尾部。首部又包含目标 Mac 地址，源 Mac 地址，上层协议类型。数据包能容纳的数据范围为 46 ~ 1500 个字节。帧尾是一个 FCS （帧检验序列），占 4 个字节。

![以太网帧结构](https://user-images.githubusercontent.com/8939151/111024423-b32c3600-8419-11eb-92da-36dcb226bf0f.png)

在总线型与环路型网络中，以太网发送数据，是发向本网络所有的主机中，让每台主机自己去判断，是否为接受方。判断的依据就是自己的 Mac 地址与接受到的 Mac 地址是否相同。

### 3.2 无线通信

无线通信现在用的也很多，典型的就是现在手机的移动通信网络，简单介绍一下，跟以太网类似，也采用 Mac 地址来寻找主机，不过是通过基站的方式实现通信，其物理层使用电磁波或红外线来传输数据。



## 4. 网络层

IP（Internet Protocol）层即网络层，它的作用是实现了主机与主机之间点对点的通信。

IP 面向无连接。即在发包之前，不需要建立与对端目标地址之间的连接。上层如果有发送给 IP 的数据，会立即被 IP 包发送出去。

这样的好处有两个，一是简化，二是提速。面向连接比无连接相对复杂，管理每个连接本身就是一个很繁琐的事；如果每次通信都要建立连接，会降低处理速度。需要有连接时，可以委托给上层提供此服务。

### 4.1 IP 首部

通过 IP 进行通信时，需要在数据的前面加入 IP 首部信息。IP 有 IPv4 和 IPv6 两种。IPv6 包的转发效率更高，省略了首部校验和字段，减轻了路由器的压力。

![IPv4 首部](https://user-images.githubusercontent.com/8939151/111024478-f4bce100-8419-11eb-85a7-549edc34103c.png)

![IPv6 首部](https://user-images.githubusercontent.com/8939151/111024486-00100c80-841a-11eb-9787-60a54c4607a1.png)

### 4.2 路由控制

IP 之所以能点对点通信，靠的是路由控制。IP 数据在每个区间内，采用「跳」的方式传递，每跳到一个路由器上，就会去查询路由控制表，找出下一次要跳转的路由器地址，直至到达目标地址。

网络层与数据链路层的关系。就像旅行时的行程表和火车票。每一张票只负责特地区间的运输，而行程表指导了运输的方向。

![点对点通信](https://user-images.githubusercontent.com/8939151/111024496-0bfbce80-841a-11eb-9c3c-f7e780ca5e17.png)

数据链路层的作用是在互连同一种数据链路的节点直接进行包传递，而一旦跨越多种数据链路，就需要借助路由。



## 5. 传输层

IP 首部有一个协议字段，用来标识网络层的上一层（传输层）采用的协议，在传输层有两个大家很熟的协议，TCP 和 UDP。 

一台主机上会有很多应用程序，传输层在有了协议之后，如何将数据传输到具体的应用程序，这时，采用了**端口号**这样一种识别码。

到这，识别一个通信需要采用 5 个信息，他们是：源 IP 地址、目标 IP 地址、协议号（TCP 或 UDP 的一种编号）、源端口号、目标端口号。只要其中一项不同，则不是同一个通信。

### 5.1 UDP

UDP 不提供复杂的控制机制，利用 IP 提供面向无连接的通信服务。它是在应用程序的数据发来收到的那一刻，立即按照鸳鸯发送到网络上的一种机制。

所以即使网络拥堵，UDP 也无法进行流量控制等避免网络拥塞的行为；传输过程中，出现丢包，UDP 也不负责重发；甚至当包到达顺序错乱时，也不会自动纠正。

UDP 的使用场景多数在即时通信这块，随时发送数据，简单高效。

![UPD 首部](https://user-images.githubusercontent.com/8939151/111024503-1918bd80-841a-11eb-9149-c185310d7390.png)

### 5.2 TCP

TCP 与 UDP 不同，区别相当大，TCP 可以说是对 「传输、发送、通信」进行控制的协议。

![TCP 首部](https://user-images.githubusercontent.com/8939151/111024520-28980680-841a-11eb-896a-55d84da38be0.png)

#### 5.2.1 序列号

TCP 中，当发送端的数据达到接受主机时，接收端主机会返回一个已经收到的消息的通知，这个消息就是确认应答（ACK）。如果一定时间内，发送到没有等到确认应答，就可以认为数据已经丢失，需要进行重发。

这里发送到没有收到确认应答，有两种可能，一是发送途中数据丢失，二是目标主机回传应答时数据丢失。对于后一种情况，如果按照重发机制发送数据，目标主机就会反复收到相同的数据。

为了对上次应用提供可靠的传输，必须放弃重复的数据包。因此，引入了序列号这种机制，即给发送的数据标上号码，接收端查询接受数据 TCP 首部的序列号和数据长度，将自己下一步应该接受的序号作为应答回传回去，就这样，通过序列号和确认应答号，就能实现可靠传输。

#### 5.2.2 重发超时的设置

重发超时是指在重发数据之前，等待确认应答数据的那个时间间隔。这个时间长短随着数据包途径的网络环境不同而不同，加上数据包的分段是经过不同线路到达的，因此，TCP 在每次发包时都会计算往返时间以及时间偏差，重发时间一般比往返时间和时间偏差的综合时间大一点。

Unix 以及 Windows 系统中，超时都以 0.5 秒为单位进行控制，因此，重发超时都是 0.5 秒的整数倍。不过，由于最初的数据包还不知道往返时间，所以其重发超时一般设置为 6 秒左右。

若重发之后还是收不到确认应答，则等待确认的时间将以 2 倍，4倍的指数函数延长，然后在进行重新发送。达到一定重发次数之后，会判断网络或主机发生了异常，强制关闭连接，通知应用通信异常，强行终止。

#### 5.2.3 连接管理

TCP 连接与断开的过程，正常至少需要 7 个包才能完成，三次握手和四次挥手。

![三次握手四次挥手](https://user-images.githubusercontent.com/8939151/111024530-3a79a980-841a-11eb-9d6f-b704f71776fb.png)

#### 5.2.4 发送数据的长度

在建立 TCP 连接的同事，就可以确定数据包的单位，可称之为「最大消息长度」（MSS：Maximun Segment Size），最理想的情况，最大消息的长度正好是 IP 中不会被分片处理的最大数据长度。

TCP 在传输大量数据时，以 MSS 的大小将数据进行分割；重发意思以 MSS 为单位。

MSS 是在三次握手时，在两端主机之间被计算得出，两端主机在建立连接的请求时，会在 TCP 首部写入 MSS 选项，高度对方自己的接口能够适应的 MSS 的大小。然后会在两者之间选择一个较小的值使用。

![TCP以段为单位发生数据](https://user-images.githubusercontent.com/8939151/111024751-719c8a80-841b-11eb-81bb-8d1e10c7b3d9.png)

#### 5.2.5 利用窗口提速

TCP 以段为单位，为每个数据包进行确认应答，如果包的往返时间越长，通信性能越低，网络的吞吐量越差。为此，TCP 引入了窗口。确认应答不在是以每个分段，而是以更大的单位进行确认，转发时间会被大幅度缩短。简单讲，就是发送端主机，在发送了一个段之后，可以继续发送，而不必要一直等到确认应答再发送。

![TCP窗口缓冲](https://user-images.githubusercontent.com/8939151/111024767-811bd380-841b-11eb-9ad0-ee00a9372e94.png)

窗口对丢包重发的管理更加的高效和灵活，在窗口比较大，有出现报文丢失的情况下，同一个序号的确认应答会被重复不断地返回，如果发送端主机连续三次收到同一个确认应答，就会将其对应的数据进行重发。

窗口的大小是由接收端主机来控制的，TCP 首部，专门有一个字段用来通知窗口的大小，接收端缓冲区在面临数据溢出时，窗口大小的值会随之被设为一个更小的值通知给发送端，从而控制数据发送量，这也形成了一个 TCP 的流控制。

#### 5.2.6 拥塞控制

如果在通信刚开始的时候，就发送大量的数据，可能会导致网络拥堵，甚至导致网络瘫痪。TCP 为了防止该问题，在通信的一开始会通过一个叫做慢启动的算法算出数值，对发送数据量进行控制。



## 应用层

应用层，与用户最近，该层最典型的协议就是 HTTP 协议。当然还有文件传输的 FTP 协议，发送 Email 的 SMTP协议等等。

TCP 和 IP 等下层协议是不依赖与上层应用类型的协议，而应用层协议则是为了实现某种应用而设计和创造的协议。应用开发者只要关注选用哪种协议，而不必担心应用中的数据应该以哪种方式发送到目标主机。

就到这里。



## 参考资料

[图解TCP/IP](http://item.jd.com/11253710.html)