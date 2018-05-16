---
title: Guava 1 - Basic Utilities & EventBus
categories: Java
toc: true
comments: true
copyright: true
date: 2018-05-12 10:25:48
tags:
visible:
---

Guava，官方解释：「Google core libraries for Java」，Guava 是一组核心库，包括新的集合类型（如 multimap 和multiset），不可变集合，图形库，函数类型，内存缓存，以及用于并发，I / O，哈希，原始类型数据，反射，字符串处理等 API 。

我按照其 wiki 文档，阅读其源代码，整理出几篇列表，方便使用。这篇是 guava 基本的实用功能以及事件通信组件 EventBus。

<!--more-->

## Preconditions 预言

```java
// 在执行程序之前，进行预检查
checkArgument(i >= 0, "Argument was %s but expected nonnegative", i);
checkNotNull(value);
checkState(boolean);
...
```

## Using/Avoiding Null

Optional 使用 Absent 和 Present 两个对象来区分给定对象是否为 null ，并提供简单的调用，促使开发者思考 null 时的含义。

| 方法                     | 描述                                                       |
| :----------------------- | :--------------------------------------------------------- |
| Optional.of(T)           | 将一个非空对象的引用放进 Optional 中，若为空，则报错       |
| Optional.absent()        | 将一个空对象放进 Optional 中，没有任何引用                 |
| Optional.fromNullable(T) | 将一个可能为空的对象放进 Optional 中                       |
| isPresent()              | 对象是否非空                                               |
| T get()                  | 获取非空对象，若为空，则报错                               |
| T or(T)                  | 返回当前非空对象，若当前对象为空，则放回给定对象           |
| T orNull()               | 返回当前非空对象，若当前对象为空，则返回 null              |
| Set asSet()              | 返回当前对象的 Set 集合，若当前对象为空，则返回空 Set 集合 |

## Ordering

```java
// 排序操作
Ordering<Foo> ordering = Ordering.natural().nullsFirst().onResultOf(sortKeyFunction);
```

Java 8 以后可以使用 Stream 来代替 Ordering 的大部分功能

| 排序类别          |                         |                    |                       |
| :---------------- | :---------------------- | :----------------- | :-------------------- |
| NaturalOrdering   | ExplicitOrdering        | AllEqualOrdering   | UsingToStringOrdering |
| ArbitraryOrdering | ReverseOrdering         | NullsFirstOrdering | NullsLastOrdering     |
| CompoundOrdering  | LexicographicalOrdering | ByFunctionOrdering |                       |

## Object Method

| 类              | 方法                                   | 描述                     |
| :-------------- | :------------------------------------- | :----------------------- |
| MoreObjects     | toStringHelper                         | 串联多个对象并打印其内容 |
| ComparisonChain | start().compare() .compare() .result() | 链式比较                 |

## Throwables

个人没理解 guava 的作者们对 Throwables 进行 Propagation 的意义，暂不整理。可参见其官方 wiki ：https://github.com/google/guava/wiki/ThrowablesExplained

## EventBus

- EventBus 在设计上，没有使用单例，允许实例化多个 bus 。
- 使用 @Subscribe 注解来标记事件订阅的处理方法；并将这些方法缓存；该方法只能有一个参数。
- register(obj) 和 post(obj) 参数都是 Object 类型，register 的 obj 需包含带有注解的事件处理方法，以及具体的事件对象参数，post 的 obj 只需要具体的事件对象。We see this as a feature, not a bug :)
- 如果 register 事件，但没有任何处理函数，那么什么也不会发生；可以使用 DeadEvent，在里面注册一个处理没有订阅的方法，简单打印下没注册的事件。

```java
// Class is typically registered by the container.
class EventBusChangeRecorder {
  @Subscribe 
  public void recordCustomerChange(ChangeEvent e) {
    recordChange(e.getChange());
  }
}
// somewhere during initialization
eventBus.register(new EventBusChangeRecorder());
// much later
public void changeCustomer()
  ChangeEvent event = getChangeEvent();
  eventBus.post(event);
}
```



