---
title: 使用 netcat 读写 TCP UDP 数据包
categories: Network
toc: true
comments: true
copyright: true
date: 2018-01-15 14:37:06
tags:
---

netcat，简写为 nc，是 unix 系统下一个强大的命令行网络通信工具，用于在两台主机之间建立 TCP 或者 UDP 连接，并提供丰富的命令进行数据通信。nc 在网络参考模型属于应用层。使用 nc 可以做很多事情：建立连接，发送数据包，监听端口，扫描端口，处理 ip4 和 ip6，和 telnet 不同，nc 会区分错误输出和标准输出，telnet 则都是标准输出。

<!--more-->

Mac 系统自带了 netcat 工具，使用 「man nc」命令，可以查看 netcat 的使用帮助。



## 客户端/服务端模型

使用 nc 可以非常简单的构建一个基本的客户端/服务端模型。

首先在一个终端窗口，开启一个本地端口的监听。

```
nc -l 1234
```

现在 nc 就在监听 1234 端口，等待一个连接。再另开一个控制台（或另一台主机），使用 nc 连接该主机和端口。

```
nc 127.0.0.1 1234
```

这样，连接就已经建立起来了，默认是 TCP 连接，现在在任意一个控制台输入内容，另一个控制台都会收到，此时，nc 已不关心谁是客户端，谁是服务端了。

![nc cs 模型](https://user-images.githubusercontent.com/8939151/111024794-94c73a00-841b-11eb-9ff0-8f69adce6ce9.png)



## 数据传输

上面的例子，再扩展一下，就可以构建一个数据传输模型。

nc 在开启了端口监听后，将收到的内容输出到指定文件

```
nc -l 1234 > out.txt
```

在第二个机器(或控制台)上，连接该主机和端口，并向该主机传输文件

```
nc 127.0.0.1 1234 < in.txt
```

![nc 数据传输](https://user-images.githubusercontent.com/8939151/111024806-a0b2fc00-841b-11eb-9dc1-09dd866626b3.png)



## 与服务端交互

与 www.baidu.com 的 80 端口建立一个 TCP 连接

```
nc www.baidu.com 80
```

此时，仅仅是建立了一个 TCP 连接，本地的端口号是随机的。

也可以指定端口，使用 「nc -p 1234 www.baidu.com 80 」，即采用本地 1234 端口与百度 80 端口建立连接。

还可以设定连接时间，「nc -w 5 www.baidu.com 80」，即连接 5s 后自动断开。

此外，「-v」选项可以让 nc 输出详细的日志；「-u」可以建立一个 UDP 连接。

现在使用 HTTP 协议，模拟浏览器访问百度。

```
echo -n "GET / HTTP/1.0\r\n\r\n" | nc -p 1234 www.baidu.com 80
```

![访问百度](https://user-images.githubusercontent.com/8939151/111024833-b7f1e980-841b-11eb-97c8-cb350c13fa7a.png)


上面用法也可以这样写:

```
nc -p 1234 www.baidu.com 80
GET / HTTP/1.0
(回车)
(回车)
```

注意空格和回车。



## 端口扫描

端口扫描经常被系统管理员和黑客用来发现在一些机器上开放的端口，帮助他们识别系统中的漏洞。

检查本机 8088 - 8090 端口是否开启

```
nc 127.0.0.1 -z 8088-8090
```

![](https://user-images.githubusercontent.com/8939151/111024846-c93af600-841b-11eb-9e67-b009da510060.png)

![](https://user-images.githubusercontent.com/8939151/111024855-d2c45e00-841b-11eb-81fb-b39b6f2f4312.png)

可以看到，只有 8090 端口是开启的。



## 使用代理

有些网络不能直接访问, 只能通过代理服务才能访问

通过代理连接 `host.example.com` 的 42 端口，下面是一些例子，未实际验证。

```
# 使用 HTTP 代理 http://10.2.3.4:8080 与 host.example.com 的 42 端口连接
$ nc -x10.2.3.4:8080 -Xconnect host.example.com 42

# 使用 socks4 代理 socks4://10.2.3.4:8080 连接 host.example.com 的 42 端口
$ nc -x10.2.3.4:8080 -X4 host.example.com 42

# 使用 socks5 代理 socks5://10.2.3.4:8080 连接 host.example.com 的 42 端口
$ nc -x10.2.3.4:8080 -X5 host.example.com 42
```



## 选项说明

- -v : 打印详细的输出

- -l : 指定 nc 监听的端口号

- -4 : 强制 nc 使用 IPV4 地址

- -6 : 强制 nc 使用 IPV6 地址

- -n : 不走 DNS 服务器

- -p : 指定源端口

- -s : 指定源 ip

- -w : 指定闲置连接关闭的时间

- -x : 指定代理地址[:port]

- -X : 指定代理的版本

  > '4'  (SOCKS v.4)
  >
  > '5'  (SOCKS v.5)
  >
  > 'connect'  (HTTPS proxy)

- -z : 指定 nc 扫描的端口范围

- -u : 使用 UDP 代替默认的 TCP

- ...



## 参考资料

[Netcat - wikipedia](https://en.wikipedia.org/wiki/Netcat)

[使用 nc 读写 TCP/UDP 连接](http://www.ifmicro.com/%E8%AE%B0%E5%BD%95/2017/12/12/netcat-usage/)