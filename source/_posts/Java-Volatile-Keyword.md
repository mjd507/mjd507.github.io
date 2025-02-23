---
title: Java 中的 Volatile 关键字
categories: Big-Back-End
toc: true
comments: true
copyright: true
date: 2018-03-14 21:06:38
tags:
visible:
---

这次的图片是「 洒满午后阳光的公园一角」，来自 Adam Kool 之手，摄影于「美国 · 优胜美地国家公园」。 El Capitan 拥有 3000 英尺高度的纯岩石花岗岩，是摄影师的灵感之地，也是登山者的挑战之一。

<!--more-->

![El Capitan on a sunny afternoon <br/> Location: El Cap, Yosemite National Park, United States. <br/> By Adam Kool](https://user-images.githubusercontent.com/8939151/111025361-921a1400-841e-11eb-94f3-22adc6d8a530.png)

------

## 变量可见性的保证

在多线程的应用中，当操作共享变量时，每个线程首先会从主内存中copy 变量副本到当前线程的 CPU 缓存中，如果主机拥有多个 CPU，那么每个线程就可能运行在不同的 CPU 里，看下模型图

![](https://user-images.githubusercontent.com/8939151/111023500-64c86880-8414-11eb-8c70-703b9caf58f9.png)

假设现在有两个线程共享一个对象，对象有一个 int 类型 的 counter 属性，两个线程随时都可能读取 counter 的值。

```java
public class SharedObject {
  public int counter = 0;
}
```

如果 counter 变量没有被 volatile 修饰，无法保证 counter 的值何时从CPU高速缓存写回主内存，造成 CPU 缓存与主内存值不一致的情况，即**线程间的更新对其它线程不可见。**

![](https://user-images.githubusercontent.com/8939151/111023516-70b42a80-8414-11eb-8eb8-7e6f6d1b9acb.png)

Java 的 volatile 关键字能够保证跨线程变量可见性，上面例子中的 counter 如果被 volatile 修饰，那么当 counter 值改变时，会立即将值写回主内存当中，并且，其它线程读取 counter 都会从主内存中直接读取。

```java
public class SharedObject {
  public volatile int counter = 0;
}
```



## Happens-Before 有序性保证

Java VM 和 CPU 可以重新对程序中的指令进行重新排序，只要指令的语义含义保持不变，比如

```java
int a = 1;
int b = 2;
a++;
b++;
// 指令重排后，可能如下
int a = 1;
a++;
int b = 2;
b++;
```

使用 volatile ，能在一定程度上保证指令的有序性，简单讲就是。当程序执行到 volatile 修饰变量的读写操作时，在其前面的操作肯定已经全部执行，且结果对后面的操作可见，在其后面的操作肯定还没执行

```java
int a = 1;
int c = 3;
volatile int b = 2; 
a++;
b++;
// 上面代码，指令重排时，不会将 volatile 之后的排到 volatile 之前，反之同理
// 但 volatile 之前的或者之后，指令可能会重排，即可能排成下面这样
int c = 3;
int a = 1;
volatile int b = 2; 
b++;
a++;
```

 volatile 的 Happens-Before 就是保证了该变量之前的变量读写操作可见。



## 原子性的缺陷

volatile 保证所有的读取操作都是直接从主内存中获取，并且所有的写操作也会写到主内存中，但多线程同时读写的时候，会有一个竞争，比如线程 A 从主内存中读取 counter 值为 1 到 CPU 缓存，准备进行 +1 操作，这时线程 B 也去从主内存中读取 counter 值，因为 A 还没有同步到主内存中，所有 B 读取的值还是 1，这时也进行 +1 操作，最后相当于主内存的 counter 被写了两次相同的值 1，从而无法保证变量值的同步。


![](https://user-images.githubusercontent.com/8939151/111023522-7c9fec80-8414-11eb-9bc0-361ed54095f2.png)

如果要保证原子性的操作，那么就需要消耗点性能，对操作的方法用 synchronized 同步锁修饰，或者 Lock，如果是基本数据类型，还可以采用 AtomicInteger 等原子操作类处理。



PS：volatile 变量可以被看作是一种 程度较轻的 synchronized，与 `synchronized` 块相比，volatile 所需的编码更简洁，并且运行时开销也较少，但是它所能实现的功能也仅是 synchronized 的一部分。



## 参考

[Java Volatile Keyword](http://tutorials.jenkov.com/java-concurrency/volatile.html)