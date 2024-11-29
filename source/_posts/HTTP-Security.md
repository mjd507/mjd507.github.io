---
title: HTTPS 安全机制
categories: Network
toc: true
comments: true
copyright: true
date: 2018-01-30 11:14:07
tags:
---

使用 HTTPS 时，所有的 HTTP 请求和响应数据在发送到网络之前，都要先进行加密。 HTTPS 在 HTTP 下面提供了一个数据传输级的安全层（SSL or TLS），用来对数据进行加密。

写这篇文章时，看到了一篇很形象的阐述 HTTPS 的安全的故事，故事有趣不枯燥，推荐大家可以直接看看这篇 [HTTPS 的故事](https://zhuanlan.zhihu.com/p/33043251)。

<!--more-->

## 数据加密的方式

简单解释下密钥，即改变密码行为的数字化参数。比如明文密码循环 N 个移位的编码与解码，这个 N 就是密钥。

### 对称密钥

编 / 解码使用相同密钥。通信双方要共享相同的密钥才能进行通信。流行的对称密钥加密算法包括：DES(64位)、Triple-DES(3次DES 加密)、RC4( 8- 2048位)。

密钥达到 128 位就很难暴力枚举出来了。

对称密钥的缺点：

- 通信之前，要确认好共享的密钥。（第一次通信，确认密钥时是明文，不安全）
- 每对通信双方需要保存加密算法和对应的密钥，而不同主机的通信很多，加密算法和密钥管理成本巨大且容易泄漏。

### 公开密钥

公开密钥加密，也称为非对称密钥加密，有两把密钥：**公钥**和**私钥**，服务端将公钥发送给客户端，客户端使用公钥加密信息，服务端接受消息后使用私钥解密。流行的公开密钥加密算法有 RSA 算法。

如果每次通信都用公钥加密，私钥解密，可能会影响通信效率，常见的做法是采用混合加密系统，即先通过公开密钥加密技术建立起安全通信，后续通信可以采用对称密钥加密。

## 数字签名

数字签名是附加在报文上的特殊加密校验码。通常是用非对称公开密钥技术产生的。只有所有者才知道其私有密钥，所以可以将私有密钥当作一种「指纹」使用。

如果签名就匹配不上，客户端就可以认为受到的数据不是来自请求的服务器，而是中途被拦截重放了。

## 数字证书

数字证书由权威机构发行，里面包含了很多信息，上面的通信数字签名信息也是证书里的一部分。

数字证书的格式普遍采用的是[X.509](https://baike.baidu.com/item/X.509)V3国际标准，一个标准的 X.509 数字证书包含以下一些内容：

- 证书的版本信息
- 证书的序列号，每个证书都有一个唯一的证书序列号
- 证书所使用的签名算法
- 证书所有人的**公开密钥**
- 证书发行者对证书的**签名**
- …...

## HTTPS 通信过程

1. 在 HTTPS 中，客户端首先打开一条到 Web 服务器端口 443 的连接。
2. 一旦建立了 TCP 连接，客户端和服务器就会初始化 SSL 层，并做一些准备工作（对加密参数进行沟通，并交换密钥），包括：
   - 交换协议版本号
   - 选择一个两端都了解的密码
   - 对两端的身份进行认证
   - 生成临时的会话密钥，以便加密信道。
3. SSL 初始化就完成后，客户端就可以将请求报文发送给安全层了。安全层按照约定对其加密，再发送给 TCP 层。
4. 服务器同理，解密出数据，做出响应，先走安全层对其加密，发送给客户端。
