---
title: AsyncTask 源码解读
categories: Android
toc: true
comments: true
date: 2016-12-06 10:38:10
tags:
---

前面有一篇文章[说了说线程池](https://mjd507.github.io/2016/11/30/Android-thread-pool/)，如果对线程池还不太了解的，请务必先了解一下，因为这次要说的 AsyncTask 正是基于 线程池，它的源码只有 600 多行，刨去一堆注方法释，在刨去定义的线程池，代码真的不多！

<!--more-->

网上已经有很多对 AsyncTask 解读了，多数把源码一段一段讲解，由表及里，循序渐进，容易理解，在文章末尾我也会贴出解读的非常棒的文章链接。想一睹为快的可以直接拉到底部点进去，哈哈，我这里就随意分析了。先从 FutureTask 说起。

## FutureTask
先来看一张 FutureTask 的 UML 关系图
![FutureTask](/images/FutureTask.png)
简单解释一下：
1. Callable<V> 这个类与 Runnable 类似，里面的 call() 方法也是设计在 子线程 调用的，优势是可以返回结果或者抛出异常。
 - call() 方法什么时候会执行呢？既然在子线程跑，肯定得有线程，所以，Callable<V> 一般是传递到 ExecutorService 当中去的，通过 submit(Callable<V> task) ，最终调用 execute() 方法去执行。
 - call() 方法执行的结果是怎样的？记得 AsyncTask 有个必须实现的 doInBackground() 方法吗？ call() 方法体里面 就调用了 doInBackground() 方法来让我们自己实现耗时逻辑。

2. FutureTask 主要用来 调度任务。内部需要传入一个 Callable<V> 对象。
 - 它很好的弥补了 Thread 的不足？ 可以再看下上面的图，RunnableFuture 继承了 Runnable 接口和 Future 接口，而 FutureTask 实现了 RunnableFuture 接口。所以它既可以作为 Runnable 被线程执行，又可以作为 Future 获得操作线程已经获取执行结果。

3. ExecutorService + Callable<V> + FutureTask<V> 获取执行结果的 小栗子
 ```java
 class WorkerRunnable implements Callable<Integer>{
 	@Override
 	public Integer call() throws Exception {
 		System.out.println("子线程在进行耗时的计算任务");
 		Thread.sleep(3000);
 		int sum = 0;
 		for(int i=0;i<100;i++)
 			sum += i;
 		return sum;
 	}
 }
 ```


	public class Test {
		public static void main(String[] args) {
			ExecutorService executor = Executors.newCachedThreadPool();
			WorkerRunnable mWorker = new WorkerRunnable();
			FutureTask<Integer> mFuture = new FutureTask<Integer>(mWorker);
			executor.submit(mFuture);
			System.out.println("主线程在执行任务");
	
			try {
				System.out.println("mWorker运行结果"+ mFuture.get());
			} catch (InterruptedException e) {
				e.printStackTrace();
			} catch (ExecutionException e) {
				e.printStackTrace();
			}
	
			System.out.println("所有任务执行完毕");
		}
	}
	
	​```
	运行结果：
	​```java
	子线程在进行耗时的计算任务
	主线程在执行任务
	mWorker运行结果4950
	所有任务执行完毕
	
	​```

4. 到这里，可以猜想一下，AsyncTask 是 获怎么运行的？
 - AsyncTask 构造时，初始化了 Callable<V> mWorker 以及 FutureTask<V> mFuture，并将 mWorker 作为参数传递给了 mFuture，这样这个 mWorker 就可以控制了，线程池 execute 的时候，会调用 mFuture.run()方法，该方法会 回调 mWorker.call() 方法，最终调用调用者的 doInBackground() 方法，大致流程就是这样。后面通过 Handler 将 执行结果回调给 调用者。


下面粗略分析一下 AsyncTask 这个类。

## AsyncTask
1. 内部线程池的定义及配置

 ```java

   private static final int CPU_COUNT = Runtime.getRuntime().availableProcessors();
   private static final int CORE_POOL_SIZE = CPU_COUNT + 1;
   private static final int MAXIMUM_POOL_SIZE = CPU_COUNT * 2 + 1;
   private static final int KEEP_ALIVE = 1;

   private static final ThreadFactory sThreadFactory = new ThreadFactory() {
       private final AtomicInteger mCount = new AtomicInteger(1);

       public Thread newThread(Runnable r) {
           return new Thread(r, "AsyncTask #" + mCount.getAndIncrement());
       }
   };

   private static final BlockingQueue<Runnable> sPoolWorkQueue =
           new LinkedBlockingQueue<Runnable>(128);

   public static final Executor THREAD_POOL_EXECUTOR
           = new ThreadPoolExecutor(CORE_POOL_SIZE, MAXIMUM_POOL_SIZE, KEEP_ALIVE,
                   TimeUnit.SECONDS, sPoolWorkQueue, sThreadFactory);

   public static final Executor SERIAL_EXECUTOR = new SerialExecutor();

   private static volatile Executor sDefaultExecutor = SERIAL_EXECUTOR;

 ```
 3.0 之后，AsyncTask 默认的 线程池是 SerialExecutor ，是一个 以串行顺序执行任务 的池子，通过 同步锁 使之串行化执行。
 我们可以根据需求选择默认线程池
 ```java
 //串行实例化
 new FileAsyncTask().extcute();
 //并行实例化
 new FileAsyncTask().executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR,"");
 ```
2. 构造方法
 上面分析过了，直接贴代码
 ```java
   public AsyncTask() {
       mWorker = new WorkerRunnable<Params, Result>() {
           public Result call() throws Exception {
               mTaskInvoked.set(true);

               Process.setThreadPriority(Process.THREAD_PRIORITY_BACKGROUND);
               //noinspection unchecked
               return postResult(doInBackground(mParams));
           }
       };

       mFuture = new FutureTask<Result>(mWorker) {
           @Override
           protected void done() {
               try {
                   postResultIfNotInvoked(get());
               } catch (InterruptedException e) {
                   android.util.Log.w(LOG_TAG, e);
               } catch (ExecutionException e) {
                   throw new RuntimeException("An error occured while executing doInBackground()",
                           e.getCause());
               } catch (CancellationException e) {
                   postResultIfNotInvoked(null);
               }
           }
       };
   }

 ```
 WorkerRunnable是一个实现了Callable的抽象类,扩展了Callable多了一个Params参数
 ```java
   private static abstract class WorkerRunnable<Params, Result> implements Callable<Result> {
       Params[] mParams;
   }
 ```
3. execute() 方法
 当执行 execute() 时，实际上是调用了 executeOnExecutor 方法。这里传递了两个参数，一个是sDefaultExecutor，一个是 params。sDefaultExecutor 其实是一个 SerialExecutor 对象，实现了串行线程队列。params 最终会赋给doInBackground方法去处理。
 ```java
   public final AsyncTask<Params, Progress, Result> execute(Params... params) {
       return executeOnExecutor(sDefaultExecutor, params);
   }

 public final AsyncTask<Params, Progress, Result> executeOnExecutor(Executor exec,
           Params... params) {
       if (mStatus != Status.PENDING) {
           switch (mStatus) {
               case RUNNING:
                   throw new IllegalStateException("Cannot execute task:"
                           + " the task is already running.");
               case FINISHED:
                   throw new IllegalStateException("Cannot execute task:"
                           + " the task has already been executed "
                           + "(a task can be executed only once)");
           }
       }

       mStatus = Status.RUNNING;

       onPreExecute();

       mWorker.mParams = params;
       exec.execute(mFuture);

       return this;
   }
 ```
 AsyncTask 的异步任务有三种状态
 ```java
 PENDING 待执行状态。当 AsyncTask 被创建时，就进入了 PENDING 状态。
 RUNNING 运行状态。当调用 executeOnExecutor，就进入了 RUNNING 状态。
 FINISHED 结束状态。当 AsyncTask 完成(用户 cancel() 或任务执行完毕)时，就进入了 FINISHED 状态。
 ```
 exec.execute(mFuture) 方法 最终会进入 SerialExecutor 的 execute() 方法里，前面说过它是一个串行化的执行过程，看下 SerialExecutor 的代码：
 ```java

   private static class SerialExecutor implements Executor {
       final ArrayDeque<Runnable> mTasks = new ArrayDeque<Runnable>();
       Runnable mActive;

       public synchronized void execute(final Runnable r) {
           mTasks.offer(new Runnable() {
               public void run() {
                   try {
                       r.run();
                   } finally {
                       scheduleNext();
                   }
               }
           });
           if (mActive == null) {
               scheduleNext();
           }
       }

       protected synchronized void scheduleNext() {
           if ((mActive = mTasks.poll()) != null) {
               THREAD_POOL_EXECUTOR.execute(mActive);
           }
       }
   }

 ```
 r.run() 方法实际上调用的是 futureTask 的 run() 方法，再跟进去：
 ```java

   public void run() {
       if (state != NEW ||
           !UNSAFE.compareAndSwapObject(this, runnerOffset,
                                        null, Thread.currentThread()))
           return;
       try {
           Callable<V> c = callable;
           if (c != null && state == NEW) {
               V result;
               boolean ran;
               try {
                   result = c.call();
                   ran = true;
               } catch (Throwable ex) {
                   result = null;
                   ran = false;
                   setException(ex);
               }
               if (ran)
                   set(result);
           }
       } finally {
           // runner must be non-null until state is settled to
           // prevent concurrent calls to run()
           runner = null;
           // state must be re-read after nulling runner to prevent
           // leaked interrupts
           int s = state;
           if (s >= INTERRUPTING)
               handlePossibleCancellationInterrupt(s);
       }
   }

 ```
 这里，取出了这个 callable 对象，并调用了它的 call() 方法，于是又回调到了 AsyncTask 初始化 mWorker 的回调方法中，这里调用了 doInBackground() 的抽象方法，并 postResult() 到主线程中。
 ```java
     private Result postResult(Result result) {
       @SuppressWarnings("unchecked")
       Message message = sHandler.obtainMessage(MESSAGE_POST_RESULT,
               new AsyncTaskResult<Result>(this, result));
       message.sendToTarget();
       return result;
   }

 ```
 在InternalHandler的handleMessage中开始处理消息，InternalHandler的源码如下所示：
 ```java 
   private static class InternalHandler extends Handler {
       @SuppressWarnings({"unchecked", "RawUseOfParameterizedType"})
       @Override
       public void handleMessage(Message msg) {
           AsyncTaskResult result = (AsyncTaskResult) msg.obj;
           switch (msg.what) {
               case MESSAGE_POST_RESULT:
                   // There is only one result
                   result.mTask.finish(result.mData[0]);
                   break;
               case MESSAGE_POST_PROGRESS:
                   result.mTask.onProgressUpdate(result.mData);
                   break;
           }
       }
   }

 ```
4. cancel() 方法
 AsyncTask.cancel(mayInterruptIfRunning); 实际上调用的是 mFuture 的 cancel() 方法, 源码如下：
 ```java
   public boolean cancel(boolean mayInterruptIfRunning) {
       if (!(state == NEW &&
             UNSAFE.compareAndSwapInt(this, stateOffset, NEW,
                 mayInterruptIfRunning ? INTERRUPTING : CANCELLED)))
           return false;
       try {    // in case call to interrupt throws exception
           if (mayInterruptIfRunning) {
               try {
                   Thread t = runner;
                   if (t != null)
                       t.interrupt();
               } finally { // final state
                   UNSAFE.putOrderedInt(this, stateOffset, INTERRUPTED);
               }
           }
       } finally {
           finishCompletion();
       }
       return true;
   }

 ```

## 流程图
整个 AsyncTask 都是以代码在理流程，这里放几张 网上找的非常好的流程图，看完印象更加深刻
![AsyncTask流程图](/images/AsyncTask.png)


## 非常棒的文章
[AsyncTask源码解析](http://whuhan2013.github.io/blog/2016/08/15/asynctask-source-code/)
[AsyncTask和AsyncTaskCompat源码解析](https://github.com/white37/AndroidSdkSourceAnalysis/blob/master/article/AsyncTask%E5%92%8CAsyncTaskCompat%E6%BA%90%E7%A0%81%E8%A7%A3%E6%9E%90.md)


