---
title: 谈谈 Java 的引用类型
categories: Android
toc: true
comments: true
date: 2016-12-13 14:49:57
tags:
---

前面有一篇谈[内存泄漏](https://mjd507.github.io/2016/12/04/Android-memory-leak/)，当 Activity 使用到 AsyncTask 更新 UI 时，需要使用 **WeekReference** 来引用 Context，以免造成 Activity 不被回收，内存泄漏。可见合理的使用引用类型是多么的必要。这里就专门挑一块土地，梳理一下 Java 的引用类型。

<!--more-->

## 强引用（Strongly reachable）
格式：** A a = new A();** 
JVM 内存不足时，也不会回收，直接抛 OOM 异常。
```java
	String str  = "abc";
	System.out.println("强引用获取到的对象："+ str);

```
运行结果：
```java
强引用获取到的对象：abc
```
强引用在人为置空后，会成为垃圾，垃圾回收器扫描到就回收。


## 软引用（Softly reachable）
格式：** SoftReference<Bitmap> bitmap = new SoftReference<Bitmap>(bitmap);**
当内存不足时，对象才会回收。
```java
	String str  = "abc";
	System.out.println("强引用获取到的对象："+ str);
	
	//创建一个软引用，引用 str 
	SoftReference<String> softRefStr = new SoftReference<String>(str);
	//释放强引用
	str = null;
	String softStr = softRefStr.get();
	System.out.println("软引用获取到的对象：" + softStr);
```
运行结果：
```java
强引用获取到的对象：abc
软引用获取到的对象：abc
```
这里，虽然代码里解了强引用，但是软引用还在引用这个 str 这个对象，所以还可以获取到值，当内存不足时，才会被回收。如果 使用 softRefStr.clear() 方法来释放软引用，那么软引用获取的对象值就为 null 了。


不要使用软引用去做缓存，因为程序在运行时，系统并不知道具体持有或回收哪些引用，回收太早，等于做了不必要的工作，回收的太晚，浪费内存。所以重点来了，**推荐使用 android.util.LruCache 代替软引用，LruCache 允许用户知道分配了多少内存，以及可靠的回收策略。**

## 弱引用（Weakly reachable）
格式：** WeakReference<Context> context = new WeakReference<Context>(context);**
随时会被回收，只要被回收器检测到。
```java
	String str  = "abc";
	System.out.println("强引用获取到的对象："+ str);

	//创建一个弱引用，引用 str 
	WeakReference<String> weakRefStr = new WeakReference<String>(str);
	str = null;
	System.gc();
	String weakStr = weakRefStr.get();
	System.out.println("弱引用获取到的对象：" + weakStr);

```
再仔细看下代码，这里有坑。
好，我们知道弱引用会被垃圾回收器随时回收，那么这里，我们通过 System.gc() 方法来主动通知虚拟机回收，这个过程可以认为是及时执行的，那么弱引用获取到的结果应该为 null 对不对？我们来看下运行结果：
```java
强引用获取到的对象：abc
弱引用获取到的对象：abc
```
结果不为 null，为什么，System.gc() 是可以认为及时回收的，这里问题其实出现在 str 这个对象上，垃圾回收器回收的是 堆中的对象，而 str 是在 **常量池** 里的，所以验证的话，得把 str 引用一个堆对象。改成下面代码：
```java
	String str  = new String("abc");
	System.out.println("强引用获取到的对象："+ str);

	//创建一个弱引用，引用 str 
	WeakReference<String> weakRefStr = new WeakReference<String>(str);
	str = null;
	System.gc();
	String weakStr = weakRefStr.get();
	System.out.println("弱引用获取到的对象：" + weakStr);

```
运行结果：
```java
强引用获取到的对象：abc
弱引用获取到的对象：null
```

## 虚引用（Phantom reachable）
几乎不用，形同虚设。这里不进行叙述。


