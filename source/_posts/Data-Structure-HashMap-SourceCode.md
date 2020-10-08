---
title: HashMap 源码分析（一）
categories: Data Structure & Algorithm
toc: true
comments: true
copyright: true
date: 2017-04-22 14:34:29
tags:
---

HashMap 被设计成专门用来存储键值对（key-value）形式的数据，每一个元素都是一个 Entry<K,V> 节点；它底层的数据结构是哈希表，它是一个数组，同时也是一个链表，简单来说，就是根据节点的 key 的 hash 值，来决定该元素存放在数组的位置，hash 值相同，则在该位置后面以链表的形式存储元素，本文简单分析下 HashMap 的源码，基于 JDK 1.8 。

<!--more-->
先来看一张图，对 HashMap 的结构留个印象。

![HashMap](/images/Structure/HashMap.png)

上次听到这么一个例子，来解释 HashMap 很形象，说：微信里的通讯录，联系人是按照字典顺序排好的，A - Z 就像是一个固定的数组，联系人按照自己的首字母的拼音放在对应的数组里，如果拼音相同，则以类似链表的形式放在该位置后面；真的好形象，只不过HashMap 是以 key 的 hash 值来决定在数组的位置的。

## 构造方法

HashMap 的有多个构造方法，但最终都是为了初始化两个参数服务的，一个是**容量**，另一个是**加载因子**，HashMap 默认容量为 16，默认的加载因子为 0.75，即：默认当容量超过 3/4 时会进行扩容操作，扩容会将容量扩为当前容量的 2 倍。来看这几个成员变量的定义。

```java
/** HashMap 默认初始化时的容量为 16，必须是 2 的倍数 */
static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; // aka 16

/** HashMap 默认的加载因子，即默认当容量达到 3/4 时，会进行扩容操作 */
static final float DEFAULT_LOAD_FACTOR = 0.75f;

/** 扩容后的容量的值大小*/
int threshold;

/** 加载因子(扩容因子) */
final float loadFactor;

public HashMap(int initialCapacity, float loadFactor) {
  // ...
  this.loadFactor = loadFactor;
  this.threshold = tableSizeFor(initialCapacity);
}

```

tableSizeFor(capacity) 方法的作用就是将容量变为原来的两倍。

## 添加元素

put(k,v) 方法的大致思路：

1. 计算出 key.hashCode() 的 hash 值；
2. 对计算出的 hash 在进行一次 hash，计算出该 key 的 index；
3. 如果 hash 值没碰撞则直接放到数组里；
4. 如果 hash 值碰撞了
   1. 以链表的形式存放在数组元素；
   2. 如果碰撞导致链表过长(binCount >= TREEIFY_THRESHOLD - 1)，就把链表转换成红黑树；
   3. 如果节点已经存在就替换 old value
5. 如果容量满了(超过load factor*current capacity)，就要resize。

```java
    public V put(K key, V value) {
      	//对 key.hashCode() 做 hash
        return putVal(hash(key), key, value, false, true);
    }

    final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
        Node<K,V>[] tab; Node<K,V> p; int n, i;
      	// tab 为空则创建
        if ((tab = table) == null || (n = tab.length) == 0)
            n = (tab = resize()).length;
      	// 对 hash 值在做一次 hash，计算出 index
        if ((p = tab[i = (n - 1) & hash]) == null)
          	// 如果该 index 的元素为空，直接创建一个node
            tab[i] = newNode(hash, key, value, null);
        else { // 该 index 有元素了
            Node<K,V> e; K k;
          	// 节点已经存在
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
          	// 该链为树
            else if (p instanceof TreeNode)
                e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
          	// 该链为链表
            else {
                for (int binCount = 0; ; ++binCount) {
                    if ((e = p.next) == null) {
                        p.next = newNode(hash, key, value, null);
                        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                            treeifyBin(tab, hash);
                        break;
                    }
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        break;
                    p = e;
                }
            }
            if (e != null) { // existing mapping for key
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                afterNodeAccess(e);
                return oldValue;
            }
        }
        ++modCount;
        if (++size > threshold)
            resize();
        afterNodeInsertion(evict);
        return null;
    }

```

## 查询元素

get(key) 方法的大致思路：

1. 计算出 key.hashCode() 的 hash 值
2. 查找数组第一个元素节点，如果 hash 值相等，key 也相等，直接返回这个节点；
3. 如果不是第一个元素，则通过判断 key 是否相等去查找对应的节点
   1. 若为树，则在树中去查找；
   2. 若为链表，则在链表中去查找；

```java
    public V get(Object key) {
        Node<K,V> e;
        return (e = getNode(hash(key), key)) == null ? null : e.value;
    }

    final Node<K,V> getNode(int hash, Object key) {
        Node<K,V>[] tab; Node<K,V> first, e; int n; K k;
        if ((tab = table) != null && (n = tab.length) > 0 &&
            (first = tab[(n - 1) & hash]) != null) {
          	// 判断与数组第一个节点元素是否相等
            if (first.hash == hash && // always check first node
                ((k = first.key) == key || (key != null && key.equals(k))))
                return first;
          	// 不相等
            if ((e = first.next) != null) {
              	// 从树中查找
                if (first instanceof TreeNode)
                    return ((TreeNode<K,V>)first).getTreeNode(hash, key);
              	// 在链表中查找
                do {
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        return e;
                } while ((e = e.next) != null);
            }
        }
        return null;
    }

```

## hash 函数

在 get 和 put 方法中，计算下标时，先对 key.hashCode() 进行 hash 操作，然后通过计算出的 hash 在进行一次hash 操作，两个过程的代码如下：

```java
    static final int hash(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }

```

```java
	int index = (n - 1) & hash
```

整个计算的过程如下图（图片来自参考文章里）：

![index 计算过程](/images/Structure/HashMap_hash.png)

在 Java 8 之前的实现中是用链表的，在产生碰撞的情况下，进行 get 时，两步的时间复杂度是O(1) + O(n)。因此，当碰撞很厉害的时候 n 很大，O(n) 的速度显然是影响速度的。

因此在 Java 8 中，利用红黑树替换链表，这样复杂度就变成了O(1) + O(logn) 了，这样在 n 很大的时候，能够比较理想的解决这个问题，在 [Java 8：HashMap的性能提升](http://www.importnew.com/14417.html) 一文中有性能测试的结果。

## resize 函数

resize 会把容量变为原来的 2 倍，之后重新计算 index，再把节点放到新的数组中。

```java
    final Node<K,V>[] resize() {
        Node<K,V>[] oldTab = table;
        int oldCap = (oldTab == null) ? 0 : oldTab.length;
        int oldThr = threshold;
        int newCap, newThr = 0;
        if (oldCap > 0) {
          	 // 超过最大值就不再扩充了
            if (oldCap >= MAXIMUM_CAPACITY) {
                threshold = Integer.MAX_VALUE;
                return oldTab;
            }
          	// 没超过最大值，就扩充为原来的2倍
            else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                     oldCap >= DEFAULT_INITIAL_CAPACITY)
                newThr = oldThr << 1; // double threshold
        }
        else if (oldThr > 0) // initial capacity was placed in threshold
            newCap = oldThr;
        else {               // zero initial threshold signifies using defaults
            newCap = DEFAULT_INITIAL_CAPACITY;
            newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
        }
      	// 计算新的resize上限
        if (newThr == 0) {
            float ft = (float)newCap * loadFactor;
            newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
                      (int)ft : Integer.MAX_VALUE);
        }
        threshold = newThr;
        @SuppressWarnings({"rawtypes","unchecked"})
            Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
        table = newTab;
        if (oldTab != null) {
          	// 把每个元素都移动到新的数组中
            for (int j = 0; j < oldCap; ++j) {
                Node<K,V> e;
                if ((e = oldTab[j]) != null) {
                    oldTab[j] = null;
                    if (e.next == null)
                        newTab[e.hash & (newCap - 1)] = e;
                    else if (e instanceof TreeNode)
                        ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                    else { // preserve order
                        Node<K,V> loHead = null, loTail = null;
                        Node<K,V> hiHead = null, hiTail = null;
                        Node<K,V> next;
                        do {
                            next = e.next;
                          	// 原索引
                            if ((e.hash & oldCap) == 0) {
                                if (loTail == null)
                                    loHead = e;
                                else
                                    loTail.next = e;
                                loTail = e;
                            }
                          	// 原索引+oldCap
                            else {
                                if (hiTail == null)
                                    hiHead = e;
                                else
                                    hiTail.next = e;
                                hiTail = e;
                            }
                        } while ((e = next) != null);
                      	// 原索引放到新数组里
                        if (loTail != null) {
                            loTail.next = null;
                            newTab[j] = loHead;
                        }
                      	// 原索引+oldCap放到新数组里
                        if (hiTail != null) {
                            hiTail.next = null;
                            newTab[j + oldCap] = hiHead;
                        }
                    }
                }
            }
        }
        return newTab;
    }

```



本文大量参考自：[Java HashMap工作原理及实现](http://yikun.github.io/2015/04/01/Java-HashMap%E5%B7%A5%E4%BD%9C%E5%8E%9F%E7%90%86%E5%8F%8A%E5%AE%9E%E7%8E%B0/) ，推荐移步查看。

