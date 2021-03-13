---
title: 基于 Vector 的栈的源码分析
categories: Data Structure & Algorithm
toc: true
comments: true
copyright: true
date: 2017-04-10 19:59:32
tags:
---

栈也是线性表，但是限定仅在表尾进行插入和删除操作的线性表；做过 Android 的应该知道，Activity 是一个典型的栈结构，它的特点就是后进先出；Stack 的源码很少，因为它的父亲 Vector 都帮它做好了，所以本篇分析主要集中在 Vector 里。

<!--more-->
先来看两张图，对栈有个形象的认识
![顺序存储](https://user-images.githubusercontent.com/8939151/111024284-e621fa00-8418-11eb-9e90-e7734cd225c9.png)
![链式存储](https://user-images.githubusercontent.com/8939151/111024289-f3d77f80-8418-11eb-9771-319447d56b69.png)

栈是有顺序存储结构和链式存储结构的，本篇分析的是顺序存储结构的栈，先从构造方法开始。
## 构造方法
```java
    /**存放数据的数组*/
    protected Object[] elementData;
    /**数组的大小*/
    protected int elementCount;
    /**容量不够时，每次增加的大小*/
    protected int capacityIncrement;

    public Vector(int initialCapacity, int capacityIncrement) {
        super();
        if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal Capacity: "+
                                               initialCapacity);
        this.elementData = new Object[initialCapacity];
        this.capacityIncrement = capacityIncrement;
    }

```
跟 ArrayList 相似，构造时需要为数组分配一个初始化的容量，这里还有一个 capacityIncrement ，即容量不够时，扩容的大小，还记得前面分析的 ArrayList 扩容的大小吗，多数情况是添加已有容量的一半，而这里 Vector 不指定默认为 0 ；

但是 capacityIncrement 为 0 不代表不扩容，而是根据需要添加的元素的大小去合理的扩容，这个合理扩容即：多数情况下时为原来的 size * 2；


## 添加操作
```java
    public synchronized boolean add(E e) {
        modCount++;
        ensureCapacityHelper(elementCount + 1);
        elementData[elementCount++] = e;
        return true;
    }

    private void ensureCapacityHelper(int minCapacity) {
        // overflow-conscious code
        if (minCapacity - elementData.length > 0)
            grow(minCapacity);
    }

    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

    private void grow(int minCapacity) {
        // overflow-conscious code
        int oldCapacity = elementData.length;
        int newCapacity = oldCapacity + ((capacityIncrement > 0) ?
                                         capacityIncrement : oldCapacity);
        if (newCapacity - minCapacity < 0)
            newCapacity = minCapacity;
        if (newCapacity - MAX_ARRAY_SIZE > 0)
            newCapacity = hugeCapacity(minCapacity);
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
add() 方法被 synchronized 修饰了，说明这是一个同步的方法，其实 Vector 的增删改查都被 synchronized 修饰了，也证实了 Vector 是一个线程安全的集合；

后面的方法就跟 ArrayList 类似了，先做一个容量的检查，计算出需要扩大的容量大小；

如果 capacityIncrement 为 0（默认），则将容量扩大为原来的 2 倍，不为 0 则扩大设置的大小；

加需要添加的元素放在原有数组的最后一位，完成插入操作；

指定位置插入元素原理一样，多一步移位操作。

## 删除操作
```java

    public synchronized void removeElementAt(int index) {
        modCount++;
        if (index >= elementCount) {
            throw new ArrayIndexOutOfBoundsException(index + " >= " +
                                                     elementCount);
        }
        else if (index < 0) {
            throw new ArrayIndexOutOfBoundsException(index);
        }
        int j = elementCount - index - 1;
        if (j > 0) {
            System.arraycopy(elementData, index + 1, elementData, index, j);
        }
        elementCount--;
        elementData[elementCount] = null; /* to let gc do its work */
    }

```
这里是指定位置的删除，将删除元素的后面元素向前进一位，元素数目减一，完成删除；

如果参数是一个对象，那么需要查找该对象在数组里的位置 index，再调用上面的方法进行删除。

## 修改和查询
```java
    public synchronized E set(int index, E element) {
        if (index >= elementCount)
            throw new ArrayIndexOutOfBoundsException(index);

        E oldValue = elementData(index);
        elementData[index] = element;
        return oldValue;
    }

    public synchronized E get(int index) {
        if (index >= elementCount)
            throw new ArrayIndexOutOfBoundsException(index);

        return elementData(index);
    }

    E elementData(int index) {
        return (E) elementData[index];
    }

```

实际就是普通数据的修改和查找，没有什么难度，到这里，增删改查的核心方法都贴出来了，相信大家心里都有一个疑惑，这个跟 ArrayList 很雷同嘛，为什么要用它？

其实 Vector 类的文档注释也写明了，如果不需要线程安全，那么，建议使用 ArrayList 取代 Vector。

说了半天，好像还没跟说到今天的主题，栈。当谈起栈的时候，Vector 就有意义了，栈元素的进入与移出，需要保证一定的次序，所以多线程就有可能不正常；

好，下面来看栈的方法。

## 栈的源码
```java
    public E push(E item) {
        addElement(item);

        return item;
    }

    public synchronized E pop() {
        E       obj;
        int     len = size();

        obj = peek();
        removeElementAt(len - 1);

        return obj;
    }

    public synchronized E peek() {
        int     len = size();

        if (len == 0)
            throw new EmptyStackException();
        return elementAt(len - 1);
    }

```
push() 方法就是往栈顶添加元素，里面的 addElement 方法与上面分析的 add() 方法一模一样；

pop() 方法就是将栈顶的元素移除栈，里面的 removeElementAt 就是上面分析的移除方法；

peek() 方法是取出栈顶的元素，但是没有移除元素。


好，栈的分析就到这里，里面还有一些迭代器相关的集合共有的方法，就不详细分析了，还是那句，源码不难，注释都写得很清楚，希望多去读读。



