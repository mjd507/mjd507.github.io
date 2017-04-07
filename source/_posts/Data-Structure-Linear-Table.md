---
title: 线性表
categories: Data Structure
toc: true
comments: true
copyright: true
date: 2017-04-05 20:06:48
tags:
---


最近听了这么一段话，说武侠小说里少林寺的和尚们，在入寺时，并不会被授予易筋经、降龙十八掌等武功秘籍，而是给一个菜园，挑水，植菜，养猪，为什么呢？武功有招式和心法之分，招式建立与心法之上，内功深厚，招式才游刃有余。如今的 Android，iOS，Web 开发，说白了就是招式，招式可以千变外化，如果一味的追求招式，忽视内功的话，结果就像天龙八部里的鸠摩智，技术领略的内功修炼，数据结构和算法是很重要的一部分，所以我打算写几篇博客理一下数据结构。

<!--more-->

先来看一张图，了解下线性表的概念

![](/images/Structure/linear_table.png)
a1 是 a2 的前驱，a(i+1) 是 a(i) 的后继，a1 没有前驱，a(n) 没有后继；
n 为线性表的长度，若 n = 0，线性表为空表。


线性表有两种存储方式：顺序存储 和 链式存储

## 顺序存储

顺序存储本质上是一组**地址连续**的存储单元，使用数组实现，数组的大小需指定或者动态分配。

![顺序表](/images/Structure/sequential_storage.png)


顺序存储需要预分配一定的空间，后期空间不够可动态添加；

优点：查找快，O(1)的时间复杂度

缺点：插入删除慢，需要移动大量元素（想象食堂排队），O(n)的时间复杂度

## 链式存储

线性表的链式存储有三种：单链表、循环链表、双向循环链表。

链式存储的特点就是可以用**任意的存储单元**来存储线性表的数据元素，即存储单元可以连续，可以不连续。



![单链表](/images/Structure/single_linked_list.png)

将单链表中的终端结点的指针端由空指针改为向头结点，使得整个单链表形成一个环，这种头尾相连的单链表称为单循环链表，简称循环链表。

![循环链表](/images/Structure/single_cycle_linked_list.png)

在单循环链表的基础上，为每一个元素添加一个指向其前驱结点的指针域，就形成了一个双向循环链表。

![双向循环链表](/images/Structure/double_cycle_linked_list.png)


链式存储不需要分配空间，存储元素个数也不限制；

链表的优点：插入和删除效率高，O(1)的时间复杂度

缺点：查找效率低，O(n)的时间复杂度


## ArrayList 源码分析
ArrayList 内部使用数组实现，所以是顺序存储结构，这里都以 Java 中的源码分析。

先看构造方法
```java

    private static final int DEFAULT_CAPACITY = 10;

    private static final Object[] EMPTY_ELEMENTDATA = {};

    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};

    transient Object[] elementData; // non-private to simplify nested class access

    private int size;

    public ArrayList(int initialCapacity) {
        if (initialCapacity > 0) {
            this.elementData = new Object[initialCapacity];
        } else if (initialCapacity == 0) {
            this.elementData = EMPTY_ELEMENTDATA;
        } else {
            throw new IllegalArgumentException("Illegal Capacity: "+
                                               initialCapacity);
        }
    }


```
这里，通过传进来的初始化容量值来为数组分配空间，如果为 0 ，分配一个空数组，在第一个元素添加的时候，再去动态分配空间；

ArrayList 还有几个构造函数，本质上做的事情就是为数组分配空间，顺序存储就是要预先分配一定的空间；

当我们 new ArrayList(10) ,实际上 elementData 的数组就分配了 10 个地址连续的存储单元。

有两个空数组的成员变量说明一下，EMPTY_ELEMENTDATA 是指定 ArrayList 容量为 0 或传入一个空集合时 使用的，而 DEFAULTCAPACITY_EMPTY_ELEMENTDATA 是默认的空数组，即 new ArrayList(),但是没有传参数。定义两个变量的是为了后面给数组分配空间时分配多少使用的。

再看一下 add 方法
```java
    public boolean add(E e) {
        ensureCapacityInternal(size + 1);  // Increments modCount!!
        elementData[size++] = e;
        return true;
    }

    private void ensureCapacityInternal(int minCapacity) {
        if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
            minCapacity = Math.max(DEFAULT_CAPACITY, minCapacity);
        }

        ensureExplicitCapacity(minCapacity);
    }

    private void ensureExplicitCapacity(int minCapacity) {
        modCount++;

        // overflow-conscious code
        if (minCapacity - elementData.length > 0)
            grow(minCapacity);
    }

    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

    private void grow(int minCapacity) {
        // overflow-conscious code
        int oldCapacity = elementData.length;
        int newCapacity = oldCapacity + (oldCapacity >> 1);
        if (newCapacity - minCapacity < 0)
            newCapacity = minCapacity;
        if (newCapacity - MAX_ARRAY_SIZE > 0)
            newCapacity = hugeCapacity(minCapacity);
        // minCapacity is usually close to size, so this is a win:
        elementData = Arrays.copyOf(elementData, newCapacity);
    }

    private static int hugeCapacity(int minCapacity) {
        if (minCapacity < 0) // overflow
            throw new OutOfMemoryError();
        return (minCapacity > MAX_ARRAY_SIZE) ?
            Integer.MAX_VALUE :
            MAX_ARRAY_SIZE;
    }


```
在 add 方法里，并没有直接将元素添加到 size 的位置中，而是先进行了一个容量的判断，这里解决的问题就是，假使预先没有分配容量或者分配的容量已经用完，可以在动态的分配容量，而不至于让元素添加不进去；

ensureCapacityInternal 内部容量确认的方法里，首先判断是不是默认就没有分配容量，即直接 new ArrayList(),不传参数，如果是这样，就给该数组分配 DEFAULT_CAPACITY(默认值10) 和 指定最小容量 minCapacity 两个值中的最大值。

换句话说，当我们直接 new ArrayList(),不分配容量，就会在添加第一个元素前，设置最小容量 minCapacity 为 10。

内部容量的确认主要就是为上面这种不传参数的构造方法使用的，当内部容量确认好后，ensureExplicitCapacity 方法内部就通过与现有数组长度的比较，条件符合后，准备开始增长容量。

grow() 方法内部，计算出了一个比较合适的容量值，并将原有数据拷贝到新的数组里面，重写赋给 elementData 数组。多数情况下，容量增长的长度为原有容量的一半，初始不分配，第一次增长为 10。

## LiskedList 源码分析


