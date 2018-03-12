---
title: Java 日志框架 slf4j
categories: Java
toc: true
comments: true
copyright: true
date: 2018-03-08 21:50:50
tags:
visible:
---

这篇开始，会尝试性的在首部增加一张与文章无关的图片，没有其他目的，只是希望自己在整理记录时，能保持内心的平静。

这次的图片是「湖边古朴的山村」，来自 Dahee Son，摄影于「奥地利 · 哈尔施塔特」。千年盐矿，木屋古镇，2015 年仅有 1221名居民，又被称作「世界上最美的小镇」。

<!--more-->

![Quaint mountain village over a lake <br/> Location: Hallstatt, Austria.  By Dahee Son](http://ohlah9bje.bkt.clouddn.com/dahee-son-204737-unsplash.jpg?imageView2/0/w/750)

------

## slf4j 简介

slf4j 全称 Simple Logging Facade for Java，Java 简单的日志门面，如果还不了解门面模式，这是个机会。Java 里日志打印常用库的有三个

> JDK 自带的 Logger
>
> Apache 提供的 log4j
>
> Logback，log4j 开发者开源的另一个日志项目

slf4j 在三种日志框架之上做了一层抽象，它仅仅是一个门面，本身是不能打印日志的，需要配合上面具体的日志库，这样的好处在于

- 在引入 slf4j 之后，开发者仍然可以使用自己熟悉的日志库，并可以随意切换
- 多个项目或者项目的依赖，如果都使用 slf4j ，那么日志管理会相当方便

slf4j 抽象门面的项目名称为「slf4j-api」，此门面抽离出的接口，也就是上面三个具体日志库要实现的接口，主要有三个

>ILoggerFactory getLoggerFactory();
>
>IMarkerFactory getMarkerFactory();
>
>MDCAdapter getMDCAdapter();

此外 slf4j 还提供了具体的日志实现库，比如「slf4j-jdk14」、「slf4j-log4j12」、「slf4j-nop」、「slf4j-simple」，这里以「slf4j-simple」来跑下流程。



## slf4j-simple

slf4j-simple 日志库是 slf4j-api 简单的实现。初始化的过程中，将具体的 loggerFactory，markerFactory，mdcAdapter 都进行了实例化。

```java
@Override
public void initialize() {
  loggerFactory = new SimpleLoggerFactory();
  markerFactory = new BasicMarkerFactory();
  mdcAdapter = new NOPMDCAdapter();
}
```

**SimpleLoggerFactory**  简单日志工厂类，根据 SimpleLoggerConfiguration 的配置来生产 SimpleLogger。

**BasicMarkerFactory**  slf4j-api 中的标记工厂类，Marker 的作用会在下面用一个例子说明。

**NOPMDCAdapter**  slf4j-api 中没有任何操作的 MDC 适配器，MDC 的作用也会在下面说明。

现在，来使用一下这个「slf4j-simple」打印日志看看。

```java
public static void main(String args[]) {
  Logger logger = LoggerFactory.getLogger(LogTest.class);
  logger.info("Hello World");
}
// 输出内容： 配置内容可在 SimpleLoggerConfiguration 中查看
// 默认打印 [线程名] 日志级别 日志名称 - 日志内容
[main] INFO LogTest - Hello World
```

Marker 是用来标记日志内容的，但是 SimpleLogger 继承自 MarkerIgnoringBase 类，该类将打印 Marker 参数的方法全都屏蔽了，我这里对源代码稍微改了一下，来演示下 Marker 的作用。

```java
public static void main(String args[]) {
  Logger logger = LoggerFactory.getLogger(LogTest.class);
  Marker marker = new BasicMarker("mjd507-marker:");
  logger.info(marker, "Hello World");
}
//增加了 Marker 之后，日志内容前面会添加上标记的内容。
[main] INFO LogTest - mjd507-marker:Hello World
```

slf4j-simple 中对 MDC 默认也是空的实现，所以在实际项目中，不要使用这个简单的日志库，log4j 和 Logback 都有对 MDC 的实现。

## MDC

MDC 全称 Mapped Diagnostic Context，映射调试上下文。目的是为了便于我们诊断线上问题而出现的工具类。