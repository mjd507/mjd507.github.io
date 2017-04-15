---
title: 基于 LinkedList 的队列的源码分析
categories: Data Structure
toc: true
comments: true
copyright: true
date: 2017-04-11 21:06:22
tags:
---

队列是一种只允许在一端进行插入操作，而在另一端进行删除操作的线性表。插入的一段称之为队尾，删除的一段称之为队头。之前分析过 LinkedList 的时候就提到，它是一种链式结构，同时还是一个队列，所以，这篇分析其实很简单了，都是基于之前分析过的的插入删除的方法。

<!--more-->

队列也有顺序和链式的存储结构，先看三张图，对队列的形象有一个了解。
![顺序存储](/images/Structure/queue_seq.png)
![循环队列](/images/Structure/queue_seq.png)
![链式存储](/images/Structure/single_cycle_linked_list.png)

可以看到，顺序存储，队列每插入一个元素，长度就增加，而从队头移除元素时，并没有像 ArrayList 那样重新调整长度，所以会造成假溢出的现象，可以使用循环队列来解决这种假溢出。

但一般循环队列的长度都是固定的，不易扩展，所以在使用队列时，一般采用链式存储结构的队列。

队列的链式存储结构，其实就是线性表的单链表，只不过它只能尾进头出而已。

但是 LinkedList 不仅是普通的队列，它还是一个双端队列，即两端都可以进行插入删除操作。

先来看 LinkedList 普通的队列操作：

```java

    public E peek() {
        final Node<E> f = first;
        return (f == null) ? null : f.item;
    }

    public E poll() {
        final Node<E> f = first;
        return (f == null) ? null : unlinkFirst(f);
    }

```
这两个方法都可以取出头节点的元素数据，区别在于 poll() 不但取出头数据，还将头节点移出了链表，unlinkFirst() 方法内部将头节点的引用置空，并将它的下一个节点设为头节点。

```java
    public boolean offer(E e) {
        return add(e);
    }
```
offer() 方法调用了 add() 方法，这个方法实际上就是向链表的最后在添加一个节点数据，源码已经在上一篇分析过了，不在重复分析；

到这里，队列的尾进头出就完成了；下面在看看 LinkedList 作为双端队列的操作，比起普通队列，双端队列在头节点增加插入操作，尾节点增加删除操作。

```java
    public boolean offerFirst(E e) {
        addFirst(e);
        return true;
    }

    public boolean offerLast(E e) {
        addLast(e);
        return true;
    }

    public E pollFirst() {
        final Node<E> f = first;
        return (f == null) ? null : unlinkFirst(f);
    }

    public E pollLast() {
        final Node<E> l = last;
        return (l == null) ? null : unlinkLast(l);
    }

```
里面具体的方法，都差不多，贴出来未免有点重复，还是建议去读源码。

好，LinkedList 的双向队列的操作就到这里。


