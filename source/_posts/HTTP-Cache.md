---
title: HTTP 缓存
categories: 网络相关
toc: true
comments: true
copyright: true
date: 2018-02-15 21:50:27
tags:
---

一次网络通信，也许会有多个缓存，从数据库缓存，服务器缓存，代理服务器缓存，中间服务器缓存，到本地浏览器缓存等，一路缓存下来，不仅减轻服务端的压力，本地用户体验也流畅了。

HTTP 的缓存是在请求/响应头里控制的，不同版本的 HTTP 协议，缓存配置字段也有些区别。

<!--more-->

## Response Cache Headers

**1. Cache-Control** 服务端要求客户端控制缓存的指令。值有`public`,`private` ` max-age=<seconds>`, `no-cache`, `no-store`。

**2. Last-Modified** 标记资源在服务端最后被修改的时间，格式类似这样`Sat, 10 Feb 2018 07:54:47 GMT`，客户端下次请求该资源时，将该时间作为`If-Modified-Since`的参数值，放在请求头部，发送服务器判断。

**3. Etag (Entity Tag)** 标记资源在服务端的 hash 值，客服的下次请求该资源时，将该 hash 值作为`If-None-Match`的参数值，放在请求头部，发送服务器判断。

**4. Vary** 用于列出一个响应字段列表，告诉服务器遇到同一个 URL 对应着不同版本文档的情况时，如何缓存和筛选合适的版本。如果服务端同时使用请求头中`User-Agent`和`Cookie`这两个字段来生成内容，那么响应中的`Vary`字段看上去应该是这样`Vary: User-Agent, Cookie`。

> Cache-Control 和 Etag 都是 HTTP 1.1 中使用的，1.0 中采用 Expire 字段来传递资源过期时间。Etag 主要解决 Last-Modified 不够完善的问题：
>
> - 一些文件更改的仅仅是修改时间，内容没有变，这个时候并不希望客户端认为这个文件被修改了，而重新请求
> - 某些服务器不能精确得到文件的最后修改时间

## Request Cache Headers

**1. Cache-Control** 客户端告诉服务端当前使用的缓存策略。值有 `max-age=<seconds>`, `no-cache`, `no-store`。

**2. If-Modified-Since** 标记资源上次修改时间，格式类似这样`Sat, 10 Feb 2018 07:54:47 GMT`，放在请求头部，发送服务器判断。

**3. If-None-Match** 标记上次请求资源的 hash 值，放在请求头部，发送服务器判断。



## 两次访问对比

第一次访问，没有缓存信息，直接从服务器取，返回 200，并设置了缓存。

![](/images/http/http-cache-1.png)



第二次访问，服务器判断资源还没过期，使用缓存内容，返回 304。

![](/images/http/http-cache-2.png)



## 相关阅读

[How (not) to use HTTP Cache Part 1](https://medium.com/@udnisap/how-not-to-use-http-cache-part-1-3888b09bd3b2)

[How (not) to use HTTP Cache Part 2](https://medium.com/@udnisap/how-not-to-use-http-cache-part-2-a394efb89c4b)

[HTTP 协议中 Vary 的一些研究](https://imququ.com/post/vary-header-in-http.html)