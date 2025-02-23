---
title: 服务中间件基础
categories: Big-Back-End
toc: true
comments: true
copyright: true
visible: true
date: 2019-05-25 11:10:07
tags:
---

集中三大块：寻址路由，通信方式，序列化

<!--more-->


## 寻址路由

前端发起请求，一般通过透明代理（Nginx）进入后端，一旦进入后端，各个服务之间的寻址路由一般通过服务注册中心。

### 透明代理

- 硬件负载均衡设备

- LVS，Nginx 等软件负载均衡

### 服务注册中心

- Eureka
- Consul
- Zookeeper


后端在简陋，至少也得部署两台机器，因此会涉及到负载均衡。对于透明代理如 Nginx，只需简单的配置即可实现各种负载均衡，对于注册中心，开源框架也已经实现好了多种负载均衡策略。

### 常见的负载均衡算法

#### [随机算法](https://github.com/weibocom/motan/blob/master/motan-core/src/main/java/com/weibo/api/motan/cluster/loadbalance/RandomLoadBalance.java)

通过生成一个随机数来实现。

比如服务有 10 个节点，那么就每一次生成一个 1～10 之间的随机数，
假设生成的是 2，那么就访问编号为 2 的节点。

在节点数量足够多，访问量比较大的情况下，各个节点被访问的概率是基本相同的。

#### [轮询算法](https://github.com/weibocom/motan/blob/master/motan-core/src/main/java/com/weibo/api/motan/cluster/loadbalance/RoundRobinLoadBalance.java)

按照固定的顺序，把可用的服务节点，挨个访问一次。

比如服务有 10 个节点，放到一个大小为 10 的数组，从序号为 0 的节点开始访问，
访问后序号自动加 1，以此类推。

能够保证所有节点被访问到的概率是相同的。

#### [加权轮询算法](https://github.com/weibocom/motan/blob/master/motan-core/src/main/java/com/weibo/api/motan/cluster/loadbalance/ConfigurableWeightLoadBalance.java)

在轮询算法基础上，给每个节点一个权重，使每个节点被访问到的概率不同。

加权轮询算法是生成一个节点序列，该序列里有 n 个节点，n
是所有节点的权重之和。每个节点出现的次数，就是它的权重值。

比如有三个节点：a、b、c，权重分别是 3、2、1，那么生成的序列就是
{a、a、b、c、b、a}，这样的话按照这个序列访问，前 6 次请求就会
分别访问节点 a 三次，节点 b 两次，节点 c 一次。
从第 7 个请求开始，又重新按照这个序列的顺序来访问节点。

#### [最少活跃连接算法](https://github.com/weibocom/motan/blob/master/motan-core/src/main/java/com/weibo/api/motan/cluster/loadbalance/ActiveWeightLoadBalance.java)

每一次访问都选择连接数最少的节点。

实现时，需要记录跟每一个节点的连接数，这样在选择节点时，
才能比较出连接数最小的节点。

#### [一致性 hash 算法](https://github.com/weibocom/motan/blob/master/motan-core/src/main/java/com/weibo/api/motan/cluster/loadbalance/ConsistentHashLoadBalance.java)

通过某个 hash 函数，把同一个来源的请求都映射到同一个节点上。


## 通信方式

### bio

基于流模型实现，提供「同步、阻塞」方式。

在读取输入流或者输出流时，读写动作完成之前，线程会一直阻塞在那里。

#### 应用层图例

![image](http://icdn.apigo.cn/blog/javacore-io-005.png)

#### 操作系统层图例

![image](http://loveshisong.cn/static/images/BIO.png)


### nio

基于 Channel、Selector、Buffer 等实现多路复用，
提供「同步，非阻塞」IO 操作。

所有 socket 建立连接后，会注册到 Selector (多路复用器) 上。

#### 应用层图例

![image](http://icdn.apigo.cn/blog/javacore-io-006.png)

#### 操作系统层图例一

![image](http://loveshisong.cn/static/images/NIO.png)

#### 操作系统层图例二

![image](http://loveshisong.cn/static/images/Multiplexing_IO.png)


### aio

Java 1.7 之后引入，NIO 的升级版本，异步非堵塞的 IO 操作。

基于事件和回调机制实现的，操作之后会直接返回，不会堵塞，
当后台处理完成，会通知相应的线程进行后续的操作。


#### 操作系统层图

![image](http://loveshisong.cn/static/images/AIO.png)


## 序列化

我创建了一个简单的实体，包括对象，集合。

```java
@Data
public class TestEntity implements Serializable {

    private String strKey;

    private Integer intKey;

    private Boolean boolKey;

    private InnerObj innerObj;

    private List<InnerObj> objList;

    @AllArgsConstructor
    @NoArgsConstructor
    @Data
    public static class InnerObj implements Serializable {
        private String key;

        private Object val;
    }

    public static TestEntity getTestEntity() {
        InnerObj innerObj = new InnerObj("inner-key", "inner-val");
        List<InnerObj> objList = new ArrayList<>();
        objList.add(innerObj);
        objList.add(innerObj);
        return new TestEntity("outer-key", 1, true, innerObj, objList);
    }

}
```
看看各个序列化框架的序列化后的结果。

### Java 序列化

仅支持与 Java 项目之间的通信，无法跨语言。序列化后的流过大，效率不高。

```html
��sr/com.test.serial.TestEntityzH��3�
�LboolKeytLjava/lang/Boolean;LinnerObjt:Lcom/test/serial/TestEntity$InnerObj;LintKeytLjava/lang/Integer;
LobjListtLjava/util/List;LstrKeytLjava/lang/String;xpsrjava.lang.
Boolean� r�՜��Zvaluexpsr8com.test.serial.
TestEntity$InnerObj���J��Lkeyq~LvaltLjava/lang/Object;xpt
inner-keysrjava.lang.Integer⠤���8Ivaluexrjava.lang.Number
������xp{sq~srjava.util.ArrayListx����a�Isizexpwq~q~xtstr-key
```

### xml

xml 语言无关，效率不高，多用于企业内部系统之间的数据交换。

```xml
<TestEntity>
  <strKey>outer-key</strKey>
  <intKey>1</intKey>
  <boolKey>true</boolKey>
  <innerObj>
    <key>inner-key</key>
    <val>inner-val</val>
  </innerObj>
  <objList>
    <objList>
      <key>inner-key</key>
      <val>inner-val</val>
    </objList>
    <objList>
      <key>inner-key</key>
      <val>inner-val</val>
    </objList>
  </objList>
</TestEntity>

```

### json

轻量，语言无关，可读性也强。相比 xml，码流更小。多用于与客户端交互。

有很多 json 序列化的框架，比如 Jackson，fastjson，gson。

```json
{
  "strKey" : "outer-key",
  "intKey" : 1,
  "boolKey" : true,
  "innerObj" : {
    "key" : "inner-key",
    "val" : "inner-val"
  },
  "objList" : [ {
    "key" : "inner-key",
    "val" : "inner-val"
  }, {
    "key" : "inner-key",
    "val" : "inner-val"
  } ]
}
```

### Protocol Buffers

Google 开源，语言无关，空间开销小，解析性能高。

多用于后端项目之间的 rpc 调用

```html

  outer-key"
  inner-key  inner-val2
  inner-key  inner-val2
  inner-key  inner-val
```

### 性能对比

![image](https://user-images.githubusercontent.com/8939151/57075093-61dc9700-6d18-11e9-81bc-6047a41849c9.png)


