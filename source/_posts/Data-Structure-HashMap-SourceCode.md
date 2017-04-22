---
title: HashMap 源码分析
categories: Data Structure
toc: true
comments: true
copyright: true
date: 2017-04-22 14:34:29
tags:
---

我之前在开发的时候，遇到需要用键值对来处理数据的时候，会毫不犹豫地选择 HashMap （也没有其他选择），知道它内部有一个 Entry<K,V> 关系映射来存储元素，但对它的内部原理的理解还不够，所以打算把它内部的源码梳理一遍，源码基于 JDK 1.8 。

<!--more-->

## 构造方法

```java
/** HashMap 默认初始化时的容量为 16，必须是 2 的倍数 */
static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; // aka 16
/** HashMap 最大的容量 2³º*/
static final int MAXIMUM_CAPACITY = 1 << 30;
/** HashMap 默认的加载因子，即当容量达到 (capacity * load factor)的值时，会进行扩容操作 */
static final float DEFAULT_LOAD_FACTOR = 0.75f;
/** 扩容之后的容量大小 */
int threshold;
/** 加载因子(扩容因子) */
final float loadFactor;

public HashMap(int initialCapacity, float loadFactor) {
        if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal initial capacity: " +
                                               initialCapacity);
        if (initialCapacity > MAXIMUM_CAPACITY)
            initialCapacity = MAXIMUM_CAPACITY;
        if (loadFactor <= 0 || Float.isNaN(loadFactor))
            throw new IllegalArgumentException("Illegal load factor: " +
                                               loadFactor);
        this.loadFactor = loadFactor;
        this.threshold = tableSizeFor(initialCapacity);
}


```

HashMap 的有多个构造方法，但最终都是为了初始化容量和加载因子服务的，HashMap 的容量总是 2 的倍数，最大容量为 2 的 30 次方，默认加载因子为 0.75f，