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
![链式存储](/images/Structure/queue_link.png)
可以看到，顺序存储，队列每插入一个元素，长度就增加，而从队头移除元素时，并没有像 ArrayList 那样重新调整长度，所以会造成假溢出的现象，可以使用循环队列来解决这种假溢出。