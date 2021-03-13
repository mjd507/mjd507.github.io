---
title: Java 日志框架 slf4j
categories: Java & Android
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

![Quaint mountain village over a lake <br/> Location: Hallstatt, Austria.  By Dahee Son](https://user-images.githubusercontent.com/8939151/111025343-79a9f980-841e-11eb-8977-e0ed68b2ce54.png)

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

MDC 全称 Mapped Diagnostic Context，映射调试上下文。目的是为了便于我们诊断线上问题而出现的工具类。在多个客户端并发访问的情况下，通过给每个客户端的请求指定一个唯一标记，从而方便日志排查。这里以 Logback 为例，介绍下 里面的 MDC。

### MDC 基本使用

```java
static final Logger logger = LoggerFactory.getLogger(LogTest.class);

public static void main(String args[]) {
  MDC.put("name", "john");
  MDC.put("age", "20");
  logger.info("Hello,I am john. I was 20");

  MDC.put("name", "jay");
  MDC.put("age", "24");
  logger.info("I am jay. I love programming.");
}

// logback.xml 部分配置
<Pattern>[%thread] %-5level %logger{36} %X{name} %X{age} - %msg%n</Pattern>

// 输出结果
[main] INFO  LogTest john 20 - Hello,I am john. I was 20
[main] INFO  LogTest jay 24 - I am jay. I love programming.
    
```

在 logback.xml 配置文件中，通过 %X 标记符来记录 MDC 中指定的值。

### MDC 高级使用

MDC 上下文是以每个线程为基础进行管理的，允许每个服务器为线程设置不同的 MDC 标记。比如 put 和 get 之类的方法仅影响当前线程的 MDC 以及 **当前线程的子线程**，具体涉及到 ThreadLocal 和 InheritableThreadLocal 两个类，我们在使用 MDC 时不必担心线程安全性或同步问题。

```java
public class LogTest {

  public static void main(String args[]) {
    ServerHandler serverHandler1 = new ServerHandler("192.168.1.1");
    serverHandler1.handleRequest();
    ServerHandler serverHandler2 = new ServerHandler("192.168.2.2");
    serverHandler2.handleRequest();
  }

  // 服务器对请求的处理
  static class ServerHandler {
    private Logger logger = LoggerFactory.getLogger(ServerHandler.class);
    ServerHandler(String IP) {
      MDC.put("IP", IP); //将 IP 保存到 MDC 中
    }
    void handleRequest() {
      logger.info("before processing the request...");
      new Thread(new ServerService()).start();
      logger.info("after processing the request...");
      MDC.remove("IP");
    }
  }

  static class ServerService implements Runnable {
    private Logger logger = LoggerFactory.getLogger(ServerHandler.class);
    private Map<String, String> contextMap = MDC.getCopyOfContextMap(); // 获取 MDC 上下文副本

    @Override
    public void run() {
      MDC.setContextMap(contextMap); // 将父线程的 MDC 环境设置进来
      logger.info("the server is processing the request...");
    }
  }
}
// logback.xml 部分配置
<Pattern>[%-8thread] %-5level %logger{36} %X{IP} - %msg%n</Pattern>
// 输出结果
[main    ] INFO  LogTest$ServerHandler 192.168.1.1 - before processing the request...
[main    ] INFO  LogTest$ServerHandler 192.168.1.1 - after processing the request...
[main    ] INFO  LogTest$ServerHandler 192.168.2.2 - before processing the request...
[Thread-0] INFO  LogTest$ServerHandler 192.168.1.1 - the server is processing the request...
[main    ] INFO  LogTest$ServerHandler 192.168.2.2 - after processing the request...
[Thread-1] INFO  LogTest$ServerHandler 192.168.2.2 - the server is processing the request...

```

这里我模拟了两个请求，当服务端接收到请求后，使用 MDC 保存了每个请求的 IP，并开启一个子线程来处理请求，通过打印日志，可以看到通过 MDC 能区分每个请求的日志，以及一个请求在多个线程中处理的日志。

### MDC 使用场景

在校验用户身份的时候，可以声明一个 Filter，当请求进来时，获取用户 token，并保存到 mdc 中，后续操作，全都依赖 mdc 中的用户 token，当执行完毕后，清除 mdc 中的用户身份。

```java
@Override
public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
    throws IOException, ServletException {
  try {
    HttpServletRequest httpReq = (HttpServletRequest) request;
    String token = httpReq.getHeader(USER_TOKEN);
    MDC.put(USER_TOKEN, token);
    chain.doFilter(request, response);
  } finally {
    MDC.remove(USER_TOKEN);
  }
}
```

logback 的 MDC 也提供了一个过滤器 **MDCInsertingServletFilter**，可以获取 hostname、request uri、user-agent 等 HTTP 请求中的内容，在 web.xml 作如下配置

```xml
<filter>
  <filter-name>MDCInsertingServletFilter</filter-name>
  <filter-class>
    ch.qos.logback.classic.helpers.MDCInsertingServletFilter
  </filter-class>
</filter>
<filter-mapping>
  <filter-name>MDCInsertingServletFilter</filter-name>
  <url-pattern>/*</url-pattern>
</filter-mapping> 
```

确保 MDCInsertingServletFilter 过滤器声明在其它过滤器之前。

logback.xml 中日志格式加上 %X{req.remoteHost} %X{req.requestURI} 等需要记录的标记即可。