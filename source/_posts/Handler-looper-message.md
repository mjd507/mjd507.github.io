---
title: 谈谈 Handler 机制
categories: Java & Android
toc: true
comments: true
date: 2016-12-08 10:11:59
tags:
---
说到 Handler，立马会联想到异步消息机制，从而扯出 Looper 以及 Message。一个异步消息机制的流程大致这样：Handler 发送一个 Message 进入到 MessageQueue 中，Looper 不断的轮询 MessageQueue 取出 Message，然后将消息 分发给 发送给它的 Handler 对象，最后我们复写 handler 的 handleMessage(msg) 方法处理消息。下面详细分析。

<!--more-->

先说一个很少见到，但在里面非常重要的对象 ThreadLocal。简单说一下它的重要性：Looper 内部通过 ThreadLocal 来将自己提供给对应的 Handler，如果没有 ThreadLocal，Handler 与 Looper 的一一对应关系就会错乱，从而 消息机制失效。

## ThreadLocal
ThreadLocal 是一个线程内部的数据存储类，使每个线程都能维护自己的数据。当多个线程共享同一个 ThreadLocal 对象，使用它来设置或读取数据时，并不会影响其他线程，其他线程也不会影响它。可以先来看个栗子。
```java
	public static void main(String[] args) {
		ThreadLocal<Integer> threadLocal = new ThreadLocal<Integer>();
		
		threadLocal.set(1);
		System.out.println(Thread.currentThread().getName()+ " 从ThreadLocal获取的值 = " + threadLocal.get());
		
		new Thread("Thread-1"){
			public void run() {
				threadLocal.set(2);
				System.out.println(Thread.currentThread().getName()+ " 从ThreadLocal获取的值 = " + threadLocal.get());
			};
		}.start();
		
		new Thread("Thread-2"){
			public void run() {
				System.out.println(Thread.currentThread().getName()+ " 从ThreadLocal获取的值 = " + threadLocal.get());
			};
		}.start();
	}

```
上面有三个线程执行了 同一个 threadLocal 的 get() 方法，主线程 和 Thread-1 线程设置了不同的值，Thread-2 没有赋值，看下运行结果
```java
main 从ThreadLocal获取的值 = 1
Thread-1 从ThreadLocal获取的值 = 2
Thread-2 从ThreadLocal获取的值 = null
```
这里应该明白了它的作用了吧！
下面看看源码分析一下它为何如此神奇？
先看它的 set() 方法
```java
	public void set(T value) {
	    Thread currentThread = Thread.currentThread();
	    Values values = values(currentThread);
	    if (values == null) {
	        values = initializeValues(currentThread);
	    }
	    values.put(this, value);
	}

```
这里设置数据的时候，调用的 values()方法，并将调用的 thread 传了进去。看下 values() 方法。
```java
    Values values(Thread current) {
        return current.localValues;
    }

```
看到没？调用了 Thread 的 localValues 成员变量，Thread 类的 localValues 专门用于存储线程的 ThreadLocal 的数据。如果 localValues == null ，那么就需要对其进行初始化，初始化后再将 ThreadLocal 的值进行存储。localValues内部有一个数组：private Object[] table ，ThreadLocal 的值就是存在在这个 table 数组中，下看下 values.put(this, value)具体实现。
```java
    void put(ThreadLocal<?> key, Object value) {
        cleanUp();

        // Keep track of first tombstone. That's where we want to go back
        // and add an entry if necessary.
        int firstTombstone = -1;

        for (int index = key.hash & mask;; index = next(index)) {
            Object k = table[index];

            if (k == key.reference) {
                // Replace existing entry.
                table[index + 1] = value;
                return;
            }

            if (k == null) {
                if (firstTombstone == -1) {
                    // Fill in null slot.
                    table[index] = key.reference;
                    table[index + 1] = value;
                    size++;
                    return;
                }

                // Go back and replace first tombstone.
                table[firstTombstone] = key.reference;
                table[firstTombstone + 1] = value;
                tombstones--;
                size++;
                return;
            }

            // Remember first tombstone.
            if (firstTombstone == -1 && k == TOMBSTONE) {
                firstTombstone = index;
            }
        }
    }

```
ThreadLocal 的值在 table 数组中的存储位置总是为 ThreadLocal 的 reference 字段所标识的对象的下一个位置，比如 ThreadLocal 的 reference 对象在 table 数组的索引为 index ，那么 ThreadLocal 的值在 table 数组中的索引就是 index+1。最终 ThreadLocal 的值将会被存储在 table 数组中：table[index + 1] = value。
好，再来看一下 ThreadLocal 的 get() 方法。
```java
    public T get() {
        // Optimized for the fast path.
        Thread currentThread = Thread.currentThread();
        Values values = values(currentThread);
        if (values != null) {
            Object[] table = values.table;
            int index = hash & values.mask;
            if (this.reference == table[index]) {
                return (T) table[index + 1];
            }
        } else {
            values = initializeValues(currentThread);
        }

        return (T) values.getAfterMiss(this);
    }


```
非常清楚，如果 localValues 对象不为 null ，那就取出它的 table 数组并找出 ThreadLocal 的 reference 对象在 table 数组中的位置，然后 table[index + 1] 位置所存储的数据就是 ThreadLocal 的值。为 null 则初始化一下，初始化也是返回 null。

总结一下，为什么 ThreadLocal 可以在不同的线程中维护一套数据的副本并且彼此互不干扰，因为最终 get() 和 set() 方法最终都是操作的 table 数组，再从数组中根据当前 ThreadLocal 的索引去查找出对应的 value 值，而不同线程中的数组是不同的。


## Looper
Looper 是一个轮询器，私有化构造时创建了一个 MessageQueue 并获取了创建它的 Thread，这样保证一个线程只会有一个 Looper 实例，同时一个 Looper 实例也只有一个 MessageQueue。看下文档注释里的一个栗子。
```java
  *  class LooperThread extends Thread {
  *      public Handler mHandler;
  *
  *      public void run() {
  *          Looper.prepare();
  *
  *          mHandler = new Handler() {
  *              public void handleMessage(Message msg) {
  *                  // process incoming messages here
  *              }
  *          };
  *
  *          Looper.loop();
  *      }
  *  }

```
上面的线程的 run() 方法里，首先 调用了 Looper.prepare(); 目的是在 当前线程创建一个 Looper 对象。
```java
    private static void prepare(boolean quitAllowed) {
        if (sThreadLocal.get() != null) {
            throw new RuntimeException("Only one Looper may be created per thread");
        }
        sThreadLocal.set(new Looper(quitAllowed));
    }
```
Looper 对象准备好了之后，Handler 才可以登场，这里或许有疑惑了，我们在主线程使用 Handler 的时候，似乎并没有 使用 Looper.prepare()，实际上主线程就是 ActivityThread，它在被创建的时候就会去初始化 Looper，所以不用 prepare(), 主线程也不能 prepare(),看上面的代码，Looper 不为空你在 get 会抛异常！！！
handler 创建出来之后，有一个 处理消息的 回调方法，紧接着，Looper.loop()；这个方法做了什么事情呢？跟进去看一下。
```java
    public static void loop() {
        final Looper me = myLooper();
        if (me == null) {
            throw new RuntimeException("No Looper; Looper.prepare() wasn't called on this thread.");
        }
        final MessageQueue queue = me.mQueue;

        // .... 

        for (;;) {
            Message msg = queue.next(); // might block
            if (msg == null) {
                // No message indicates that the message queue is quitting.
                return;
            }

            // .... 

            msg.target.dispatchMessage(msg);

			// .... 

            msg.recycle();
        }
    }

    public static Looper myLooper() {
        return sThreadLocal.get();
    }

```
部分代码省略了，这里可以看到，loop() 方法里面，拿到 MessageQueue，并不断从里面中去取消息，交给消息的 target 属性的 dispatchMessage() 去处理。
先思考一个问题：msg 的 target 对象是 Handler，所以说，这里 dispatchMessage() 实际上是 Handler 的 dispatchMessage() 方法，Handler 是自己发消息，自己处理消息的，那么，如何保证 msg.target 这个 handler 与 发送消息的 handler 是同一个 对象？
留着疑问，我们接下来看 Handler源码。

## Handler
老规矩，先看构造方法
```java
    public Handler(Callback callback, boolean async) {
        //...

        mLooper = Looper.myLooper();
        if (mLooper == null) {
            throw new RuntimeException(
                "Can't create handler inside thread that has not called Looper.prepare()");
        }
        mQueue = mLooper.mQueue;
        mCallback = callback;
        mAsynchronous = async;
    }

```
Handler 在构造时，获取了获取当前的 Looper，获取了 Looper 的 MessageQueue，然后看发送消息的过程。
Handler 有好多发送消息的方法，但最终都进入了 sendMessageAtTime() 方法，看下代码。
```java
    public boolean sendMessageAtTime(Message msg, long uptimeMillis) {
        MessageQueue queue = mQueue;
        if (queue == null) {
            RuntimeException e = new RuntimeException(
                    this + " sendMessageAtTime() called with no mQueue");
            Log.w("Looper", e.getMessage(), e);
            return false;
        }
        return enqueueMessage(queue, msg, uptimeMillis);
    }
```
调用了 enqueueMessage() 方法，将消息加入了 队列。
```java
    private boolean enqueueMessage(MessageQueue queue, Message msg, long uptimeMillis) {
        msg.target = this;
        if (mAsynchronous) {
            msg.setAsynchronous(true);
        }
        return queue.enqueueMessage(msg, uptimeMillis);
    }
```
这里调用了 MessageQueue 的 enqueueMessage() 方法。就不在跟了，总计就是将消息加入队列。
这句留意一下 msg.target = this; 还记得之前的思考吗？这里就可以解释了，handler 发送消息，在加入消息队列前会 将 该消息的 target 设为 自己。简单来说，Handler 发送了 Message，并且这个 Message 的 target 就是这个 Handler。前面 msg.target.dispatchMessage() 方法的实现我们就可以在看下了。
```java
    public void dispatchMessage(Message msg) {
        if (msg.callback != null) {
            handleCallback(msg);
        } else {
            if (mCallback != null) {
                if (mCallback.handleMessage(msg)) {
                    return;
                }
            }
            handleMessage(msg);
        }
    }

    public void handleMessage(Message msg) {
    }

```
我们看到，当没有给 msg 设置 callback ，也没有给 handler 的 mCallback 设置过值时，会执行 handleMessage() 方法，这是一个空方法，什么都没做。
我们一般新建 Handler 时，都会复写这个方法，这样 mCallback 就不为null，就会回调我们覆盖的方法来处理相应的消息 。
最后一种情况，当 Message 对象的 callback 对象不为空时，会直接调用 handleCallback 方法，看下这个代码
```java
    private static void handleCallback(Message message) {
        message.callback.run();
    }

```
message 的 callback 是一个 Runnable() 接口，那怎样设置 Message 的 callback 呢？Handler 发送消息时，除了使用 sendMessage 方法，还可以使用 post 的方法，而他的形参正好就是 Runnable,看下它的代码。
```java
    public final boolean post(Runnable r)
    {
       return  sendMessageDelayed(getPostMessage(r), 0);
    }

    private static Message getPostMessage(Runnable r) {
        Message m = Message.obtain();
        m.callback = r;
        return m;
    }

```
这里调用 Handler 的 post() 方法，会发一个带 callback属性（Runable 对象作为 callback 属性） 的 Message 到队列中，Looper 取出消息时，直接调用的 这个 callback 对象的 run() 方法执行。

至此，Handler 机制 已经分析的差不多了，下面贴一张流程图加深一下印象。

## 流程图
![Handler Looper Message](https://user-images.githubusercontent.com/8939151/111025188-88dc7780-841d-11eb-86c5-58b78af93bdb.png)


## 非常棒的文章
[Android的消息机制之ThreadLocal的工作原理](http://blog.csdn.net/singwhatiwanna/article/details/48350919)
[Handler 之 源码解析](https://github.com/maoruibin/HandlerAnalysis)
[Android 异步消息处理机制 让你深入理解 Looper、Handler、Message三者关系](http://blog.csdn.net/lmj623565791/article/details/38377229)


