---
title: 说说线程池
categories: Android
toc: true
comments: true
date: 2016-11-30 09:02:37
tags:
---

线程池就好比一个部门，部门一般都有一个项目经理，他有一系列的项目需要安排手下去完成，当人手不够的时候，就去招人，人手够了，大家都紧锣密鼓的工作了，几天后，项目经理发现任务比较多，心里考虑着先把多余的任务排列好，等大家忙完再分配，又过了几天，任务越来越多了，需要动态的再招几个人备用，终于人手差不多了，这个时候，如果项目任务还是很多，项目经理就该考虑挡住一些任务了。

<!--more-->

哈哈，上面只是模仿线程池的设计硬举的一个例子。言归正传，为什么要使用线程池呢？

## 线程池的好处

由于创建或者销毁一个线程都是需要时间的，而且现在用户的操作像请求网络，读写文件等频率很高，如果频繁的去创建销毁线程，必然导致系统性能不佳，用户体验不好。 这个时候使用线程池就能很好的去调度线程，让系统处于一个资源利用相对平衡的状态。线程池不是新技术，之前就有，但是在 Java 1.5 之后 Doug Lea 编写了并发包（java.util.concurrent），让开发者对线程池的使用更加的方便。



## 线程池的使用方法

```java
static Executor cachePool = Executors.newCachedThreadPool(); //缓存线程池
static Executor fixedPool = Executors.newFixedThreadPool(5); // 固定线程个数的线程池
static Executor schePool = Executors.newScheduledThreadPool(4); //计划任务线程池
static Executor singlePool = Executors.newSingleThreadExecutor(); //单个线程

fixedPool.execute(Runnable r);
```

用起来非常简单，JDK 提供了几种不同的线程池，根据实际情况选择，获取到线程池的执行者之后，调用它的   execute() 方法，将任务传进去，交给线程执行。使用很简单，但是对于线程池的设计以及他的原理还是很有必要深入一下的。先自己定义一个简单得线程池跑一跑。



## 自定义线程池

```java
//100 是该容器（任务队列）的最大上限
BlockingQueue<Runnable> blockingQueue = new LinkedBlockingQueue<>(100);

//创建线程工厂
ThreadFactory threadFactory = new ThreadFactory() {
	@Override
	public Thread newThread(Runnable r) {
		AtomicInteger atomicInteger = new AtomicInteger(0);
		Thread thread = new Thread(r);
		thread.setName("MyThread = "+ atomicInteger.getAndIncrement());
		return thread;
	}
};


/**
 * @param corePoolSize 核心池个数 Google 工程师推荐 线程的个数 = CPU核心数 + 1  
 * @param maximumPoolSize 最大池个数
 * @param keepAliveTime 执行完后，线程存活时间
 * @param unit 时间单位
 * @param workQueue 工作队列
 * @param threadFactory 线程工厂
 */
ThreadPoolExecutor executor = new ThreadPoolExecutor(5, 100, 1, TimeUnit.SECONDS, blockingQueue, threadFactory);

for(int i = 0; i < 10; i++){
	executor.execute(new Runnable() {

		@Override
		public void run() {
			//do something such as net file...
		}
	});
}
executor.shutdown();
```



## Doug Lea 的设计逻辑

Doug Lea 设计线程池的逻辑与开头例子的描述几乎一致，整理如下：

> 如果当前池大小 poolSize 小于 corePoolSize ，则创建新线程执行任务。

> 如果当前池大小 poolSize 大于 corePoolSize ，小于 maximumPoolSize ，且等待队列未满，则进入等待队列

> 如果当前池大小 poolSize 大于 corePoolSize ，小于 maximumPoolSize ，且等待队列已满，则创建新线程执行任务。

> 如果当前池大小 poolSize 大于 corePoolSize 且大于 maximumPoolSize ，且等待队列已满，则调用拒绝策略来处理该任务。

> 线程池里的每个线程执行完任务后不会立刻退出，而是会去检查下等待队列里是否还有线程任务需要执行，如果在 keepAliveTime 里等不到新的任务了，那么线程就会退出。



## 几个类的说明

### ThreadFactory — 线程工厂
它是一个接口，专门负责创建线程。在线程初始化的时候可以设置优先级，线程名称，守护进程状态，线程组等。

### BlockingQueue — 阻塞队列
队列公有的方法 增加/移除/检索 元素，该队列为操作提供了四种处理形式。

1. 抛异常
2. 返回 null 或 false 
3. 阻塞线程直到操作完成 
4. 阻塞（指定时间）

|         | Throws exception | Special Value | Blocks |     Times Out      |
| ------- | :--------------: | :-----------: | :----: | :----------------: |
| Insert  |      add(e)      |   offer(e)    | put(e) | offer(e,time,unit) |
| Remove  |     remove()     |    poll()     | take() |  poll(time,unit)   |
| Examine |     Element      |    peek()     |        |                    |

BlockQueue 不接受 null 元素。否则会抛空指针异常
BlockQueue 容量是可以设定的，如果没有设定，则容量为 Integer.MAX_VALUE
BlockQueue 的实现是线程安全的。
BlockQueue 本质上不支持关闭，如果需要可以通过插入特定的结束标记 来让调用者中断。

BlockQueue 有几个常用的实现类
- LinkedBlockingQueue 链表队列
- ArrayBlockingQueue 数组队列
- SynchronousQueue 同步队列（插入操作必须等待另一个线程的删除操作之后，反之亦然）
- BlockDeque 它是个双端队列，可以两从两端插入/获取。 BlockQueue 是单端队列

## 线程池的流程图

![ThreadPool](/images/ThreadPool.png)


<br /><br /><br />

<center>
<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/"><img alt="知识共享许可协议" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-nd/3.0/cn/88x31.png" /></a><br />
本作品采用 <a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/">知识共享署名-非商业性使用-禁止演绎 3.0 中国大陆许可协议</a> 进行许可。
</center>
