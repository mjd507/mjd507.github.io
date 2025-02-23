---
title: 接入各三方支付的验签算法
categories: Big-Back-End
toc: true
comments: true
copyright: true
date: 2018-04-19 10:53:41
tags:
visible:
---

这次的图片是「宁静」，来自 [christopher__burns](https://unsplash.com/@christopher__burns) 之手，摄影于「大弯营地 · 莫阿布 · 美国」。大弯营地是国家公园，是美国最大的奇瓦瓦沙漠地形和生态保护区。它包含1200多种植物，450多种鸟类，56种爬行动物和75种哺乳动物，是美国境内最偏远，也是访问次数最少的国家公园之一。

<!--more-->

![Tranquility <br/> Location: Big Bend Campground, Moab, United States.  By christopher__burns](https://user-images.githubusercontent.com/8939151/111025396-bfff5880-841e-11eb-9733-6660de05697b.png)



用户在各个 APP 选完商品，进入支付这一阶段时，大多会调用支付宝，微信，银联，翼支付等第三方支付平台，那么就需要将商品以及订单金额等重要信息传递给第三方，这里因为涉及到金钱，所以对通信安全性要求很高；在接入第三方支付平台的时候，他们都会给出一套保证安全的规则，这里就梳理这些三方平台的数据安全保障的具体算法。

第三方平台一般会分配给平台商户一个密钥 key，该 key 每个商户唯一，请求端用这个 key 来生成签名，三方后台用此 key 来验证签名。

## 微信 & 百度钱包

百度钱包接入很方便，后台直接采用分配给商家的 key 通过 MD5 加密请求参数来验证签名。

```java
String sign = MD5.encode(reqParam = xxx & key = key);
GET https://payUrl?payParams=xx&sign=sign
```

## 支付宝

支付宝采用 RSA 非对称加密，最新接入的采用 RSA2 加密。

```java
String detailParams = "xxxx";
String sign = RSA.sign(detailParams, key, "UTF-8");
// 根据请求参数， sign签名 和 具体的 RSA 算法，生成支付链接
...
```

## 翼支付

翼支付渠道，有意思的是它的 H5 支付，分三步，下单，获取公钥，组装链接唤起 H5 收营台。

1. 下单参数采用密钥验签

   ```java
   String sign = MD5.encode(signParam = xxx & key = key);
   POST https://orderUrl
   orderParams = xx & mac=sign
   ```

2. 获取公钥

   翼支付提供了一个获取公钥的接口，里面有公钥和 index，猜测他们后台维护了一个公钥私钥的映射表。

   ```java
   POST https://getPublicKey
   ```

3. 根据随机 key，公钥，请求参数组装支付链接

   ```java
   String randomKey = AES256.getStringRandom(32); // 请求端随机生成对称加密的密钥
   String encryStr = AES256.AES_Encode(reqParam, randomKey); // 用随机密钥对称加密请求参数
   String encryKey = RSA.encrypt(randomKey, publicKey); // 用翼支付公钥对本地随机密钥进行非对称加密

   basicRequest.setKeyIndex(publicKeysIndex);
   basicRequest.setEncryKey(encryKey);
   basicRequest.setEncryStr(encryStr);
   // 根据 basicRequest 组装成唤醒 H5 收营台的链接
   ...
   ```

   翼支付 H5 的收营台，做的非常严谨，有对称和非对称加密，并且考虑到非对称的性能问题，采用 32 位随机数方案，翼支付后台先用私钥解出 32 位随机数，再用该随机数解出下单参数。

