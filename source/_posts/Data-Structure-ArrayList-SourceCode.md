---
title: ArrayList 源码分析
categories: Big-Back-End
toc: true
comments: true
copyright: true
date: 2017-04-08 20:06:48
tags:
---

ArrayList 内部采用数组实现，是一种顺序存储方式，对于它的用法，相信大家都烂熟于心了，但是对它内部数组空间的动态管理，也许还不是很熟悉，所以我这次打算分析一下 ArrayList 的源码，基于 JDK 1.8 的版本。

<!--more-->
## 构造函数
```java

    /**默认容量*/
    private static final int DEFAULT_CAPACITY = 10;
    /**空数组，调用者指定数组的容量为 0 */
    private static final Object[] EMPTY_ELEMENTDATA = {};
    /**默认的空数组，即调用者没有传容量大小，与上面的区别是该变量可以控制后面的动态扩容*/
    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};
    /**存放元素数据的数组*/
    transient Object[] elementData; // non-private to simplify nested class access
    /**数据大小*/
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

## 添加元素
```java
    public boolean add(E e) {
        ensureCapacityInternal(size + 1);  // Increments modCount!!
        elementData[size++] = e;
        return true;
    }

    private void ensureCapacityInternal(int minCapacity) {
    	//判断没有传容量参数时，进行动态分配容量
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

ArrayList 的 add 方法还有一个重载方法，add(int index,E element)，在指定位置插入元素，原理与它的 remove(int index) 类似，所以下面就以 remove(int index) 分析数组指定位置的删除操作。

## 删除操作
```java
    public E remove(int index) {
        rangeCheck(index);

        modCount++;
        E oldValue = elementData(index);

        int numMoved = size - index - 1;
        if (numMoved > 0)
            System.arraycopy(elementData, index+1, elementData, index,
                             numMoved);
        elementData[--size] = null; // clear to let GC do its work

        return oldValue;
    }

    private void rangeCheck(int index) {
        if (index >= size)
            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
    }

```
在删除操作中，首先检查要删除位置的范围，不在数组长度内，抛出数组越界异常；

计算出从要删除的位置开始，到数组最后一位的元素个数，即要像前移动一位的元素个数；

从 index + 1 开始，以及往后的元素，向前移动一位，并将数组的最后一位元素置为空，size 减少一个，将删除的值返回。

可见，顺序存储的指定位置的增删需要移动多个元素，效率不高。

## 修改和查询
```java
    public E set(int index, E element) {
        rangeCheck(index);

        E oldValue = elementData(index);
        elementData[index] = element;
        return oldValue;
    }

    public E get(int index) {
        rangeCheck(index);

        return elementData(index);
    }

```
修改和查询之前，先校验一下角标，然后直接取出对应位置的值就可以了。

至此，ArrayList 的增删改查的分析就完成了，源码还有一部分，是迭代器相关的，集合共有的东西；

基于以上的分析，可以知道，再对一个集合进行删除操作时，集合的 size 会减一，如果通过 for 循环遍历对集合进行移除操作，最后一定会出现数据不对的情况，为了避免这种情况，就应该使用迭代器操作；

来看下迭代器是如何保证遍历元素次序的。
```java

        public E next() {
            checkForComodification();
            int i = cursor;
            if (i >= size)
                throw new NoSuchElementException();
            Object[] elementData = ArrayList.this.elementData;
            if (i >= elementData.length)
                throw new ConcurrentModificationException();
            cursor = i + 1;
            return (E) elementData[lastRet = i];
        }

        public void remove() {
            if (lastRet < 0)
                throw new IllegalStateException();
            checkForComodification();

            try {
                ArrayList.this.remove(lastRet);
                cursor = lastRet;
                lastRet = -1;
                expectedModCount = modCount;
            } catch (IndexOutOfBoundsException ex) {
                throw new ConcurrentModificationException();
            }
        }

```
这里，每次调用 next() 方法，取出的元素实际上是 cursor 所指角标的元素，将这个角标的值赋给 lastRet，即最近迭代的位置；

在 remove() 方法里，移除了当前取出的元素后，将 cursor 的值设为 lastRet，什么意思？就是集合虽然移除了一位元素，size - 1 了，但我下次取元素的时候，还是取的刚才移除元素的后一位元素，保证了每次按元素的原始次序迭代。


好了，ArrayList 的源码就分析的差不多了，剩下的就是一些重载方法，几种迭代器，还是比较容易理解的，有兴趣的可以翻开源码去看一看。



