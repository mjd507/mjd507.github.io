---
title: redis 分布式锁
categories: Big-Back-End
toc: true
comments: true
copyright: true
visible: true
date: 2019-05-18 22:22:27
tags:
---

分布式资源访问控制，目前接触过两种，一是利用数据库字段，另一个就是利用 redis。

<!--more-->


## 场景

获取微信 access_token，该接口微信限制了每天调用的次数，项目里使用 redis 缓存该值，考虑到并发获取时，有很大几率调用多次该接口，故需要使用分布式锁来控制。

## redis 的 setnx

利用 redis 的 setnx，返回 true，表示拿到了分布式锁，此时再进行业务操作（获取 access_token）。为了防止业务线程挂了，导致锁得不到释放，其它线程一直等待，锁一般会增加一个过期时间。

```java
// 伪代码
String lockKey = 'lockKey';
String lockValue = 'lockValue';
getAccessToken() {
  boolean isGetLock = set lockKey lockValue NX EX 30;
  if (isGetLock) {
      try {
       // wx http request
      } catch(e) {

      } finally {
        del lockKey;
      }
  } else {
    // wait ? 
  }
}

```

我们项目也是这样用的，大部分情况都正常。最近又浏览了 redis 相关文章，发现上面代码是有问题的。

问题出现在 expire 上面，过期时间不好把控。

1. 锁过期，而业务时间很长，导致新的客户端进来继续重复执行业务。
2. 锁的交替删除，导致无限轮环调用。客户端 A 获取到了锁，执行业务，业务没执行完，而锁过期时间到了，这时，客户端 B 就会获取到锁，继续执行业务，此时 A 执行完了，会把 B 的锁删除，导致无限循环。

针对第二个问题，锁的交替删除，可以使用一个唯一值来解决。即拿锁时给一个值，删锁时，需要是这个值该给删除。

```java
// 伪代码
String lockKey = 'lockKey';
String lockValue = 'uuid';
getAccessToken() {
  boolean isGetLock = set lockKey lockValue NX EX 30;
  if (isGetLock) {
      try {
       // wx http request
      } catch(e) {

      } finally {
        if (redis.get(lockKey) === uuidValue) {
          del lockKey;
        }
      }
  } else {
    // wait ? 
  }
}
```

而第一个问题，过期时间真不好解决，有一种思路是，后台开启一个线程，当客户端没执行完时，自动延长过期时间。
已经有成熟的框架 Redisson 为我们做好了。

## Redisson

Redisson 也是 redis 官方推荐的分布式锁的解决方案。https://redis.io/topics/distlock 

```java
// 伪代码
String lockKey = 'lockKey';
RLock lock = sedisson.getLock(lockKey);
lock.lock(); // 等待直到拿到锁
try {
  // wx http request
} catch(e) {

} finally {
  lock.unlock();
}

```

掘金上有篇关于 Redisson 底层原理的分析
https://juejin.im/post/5bf3f15851882526a643e207


## 主从模式下的问题

当主节点挂了，锁的过期自动延续就断了，锁就会过期。这时从节点变为新的主节点，新的客户端会再次获得一把锁，业务重新执行一次。

能想到的是通过业务二次判断来控制执行流程。

## 参考阅读

https://mp.weixin.qq.com/s/t2M5QrLzZ2ZTPf7SRdy8NQ





