---
title: LinkedList 链表部分源码分析
categories: Data Structure
toc: true
comments: true
copyright: true
date: 2017-04-09 15:42:54
tags:
---

LinkedList 内部采用的是链表的方式存储数据，所以不像 ArrayList ，初始化时需要分配容量，该链表中每一个节点都有一个头指针、一个数据域、一个尾指针，所以是一个双向的链表，与双向循环链表不同，它的第一个节点和最后一个节点没有互相引用，所以 LinkedList 其实还是一个队列，这个作为下下篇分享的内容，本篇主要分析其数据元素的增删改查的源码，基于 JDK 1.8 版本的源码分析。

<!--more-->

## 节点的定义
先看一下构造方法
```java
    transient int size = 0;

    /**头节点*/
    transient Node<E> first;

    /**尾节点*/
    transient Node<E> last;

    public LinkedList() {
    }

```

可以看到构造方法里什么都没做，这也说明链表不受容量限制，可以随意添加元素；

成员变量有一个 Node 对象，这个就是每一个节点，来看下它的定义；
```java
    private static class Node<E> {
        E item;
        Node<E> next;
        Node<E> prev;

        Node(Node<E> prev, E element, Node<E> next) {
            this.item = element;
            this.next = next;
            this.prev = prev;
        }
    }

```

这是一个静态内部类，定义了三个属性，分别是节点的数据，下一个节点，上一个节点，到这里都非常好理解。

## 插入元素
```java
    public boolean add(E e) {
        linkLast(e);
        return true;
    }

    void linkLast(E e) {
        final Node<E> l = last;
        final Node<E> newNode = new Node<>(l, e, null);
        last = newNode;
        if (l == null)
            first = newNode;
        else
            l.next = newNode;
        size++;
        modCount++;
    }

```
首先获取最后一个节点，如果没有添加过元素，链表是空的，那么最后一个节点也为空；

再 new 一个新的节点，将新节点的前驱设为刚才获取的最后一个节点，后驱设为 null，数据域设为要添加的元素；

将最后一个节点，设为刚刚新创建的节点，到这里，应该明白，链表的默认插入操作，是将节点链接在最后一个节点之后的；

如果是第一次添加，最后一个节点就为空，则将创建的新节点作为第一个节点，所以如果只添加一个元素，第一个节点与最后一个节点指向的是同一个节点；

如果不是第一次添加，说明有最后一个节点，则将最后一个节点的后驱链接刚创建的节点，从而形成一个新的链表，将 size ++;

add()方法还有一个重载方法，可以指定位置插入，也顺道来看下；
```java
    public void add(int index, E element) {
        checkPositionIndex(index);

        if (index == size)
            linkLast(element);
        else
            linkBefore(element, node(index));
    }
    void linkBefore(E e, Node<E> succ) {
        // assert succ != null;
        final Node<E> pred = succ.prev;
        final Node<E> newNode = new Node<>(pred, e, succ);
        succ.prev = newNode;
        if (pred == null)
            first = newNode;
        else
            pred.next = newNode;
        size++;
        modCount++;
    }

    Node<E> node(int index) {
        // assert isElementIndex(index);

        if (index < (size >> 1)) {
            Node<E> x = first;
            for (int i = 0; i < index; i++)
                x = x.next;
            return x;
        } else {
            Node<E> x = last;
            for (int i = size - 1; i > index; i--)
                x = x.prev;
            return x;
        }
    }

```
指定位置插入元素，与 add() 原理差不多，多做的是先找到指定位置的节点，然后在链接到该节点之前；

查找指定节点，这里采用了二分法的思想，将 index 与 size/2 比较，比它小，就在前半段找，否则就在后半段找；

找到指定位置的节点 succ 了，在获取它的前一个节点 pred ，与此同时，new 一个新节点 newNode ，将 newNode 前驱指向 pred，后继指向该 succ ，至此形成一个单链，再将 succ 的前驱指向 newNode ，如果 pred 不为空，将 pred 的后继指向 newNode ，至此形成一个双向链表，如果 pred 为空，那么将 newNode 设为头结点，将集合 size ++；

这里说的有点绕，来张简单的图帮助理解一下，其实就是各种指针的指向引用问题。
![插入过程](/images/Structure/double_list_add.png)

## 删除元素
```java
    public E remove(int index) {
        checkElementIndex(index);
        return unlink(node(index));
    }

    E unlink(Node<E> x) {
        // assert x != null;
        final E element = x.item;
        final Node<E> next = x.next;
        final Node<E> prev = x.prev;

        if (prev == null) {
            first = next;
        } else {
            prev.next = next;
            x.prev = null;
        }

        if (next == null) {
            last = prev;
        } else {
            next.prev = prev;
            x.next = null;
        }

        x.item = null;
        size--;
        modCount++;
        return element;
    }

```
同样，获取要移除节点的前驱 prev ，后继 next ，prev 的后继设为 next ，next 的前驱设为 prev ，并将要删除节点的前去后继置为空；

如果 prev 为空，将 next 设为头节点，如果 next 为空，将 prev 设为尾节点；

删除的过程，也画了一张图
![删除过程](/images/Structure/double_list_delete.png)


至此，可以看出，链表的插入和删除操作非常的简单，只需要改变一下指针的指向问题就 ok 了。


## 查询和修改
```java
    public E get(int index) {
        checkElementIndex(index);
        return node(index).item;
    }

```
链表的查询其实上面已经分析过了，指定插入的时候，就先查询了指定位置的节点，通过 node.item 就可以获取该节点的数据了；

修改的方法就不分析了，直接贴源码；
```java
    public E set(int index, E element) {
        checkElementIndex(index);
        Node<E> x = node(index);
        E oldVal = x.item;
        x.item = element;
        return oldVal;
    }

```

好了，LinkedList 链表部分的操作基本都分析完了，还有一半的代码是 LinkedList 队列部分的操作，其实原理都是调用上面分析的方法，后面整理到栈与队列的时候，再把它拿出来啃。




