---
title: Guava 5 - Concurrency
categories: Big-Back-End
toc: true
comments: true
copyright: true
date: 2018-07-02 10:21:26
tags:
visible:
---

整理下 Guava 对并发这块的封装。

<!--more-->

## Monitor

```java
// 多个线程之间的等待和唤醒

// 1. 使用 synchronized 配合 Object 对象的 wait() 和 notifyAll()
public class SafeBox<T> {
  private T value;
  
  public synchronized void set(T newValue) throws InterruptedException {
    while (value != null) { // 如果已经有值，则等待
      wait();
    }
    this.value = newValue;
    notifyAll();
  }
  
  public synchronized T get() throws InterruptedException {
    while (value == null) {
      wait();
    }
    T result = value;
    value = null;
    notifyAll();
    return result;
  }
}

// 2. 使用 ReentrantLock 以及它自带的 Condition，Condition 提供了 await() 和 signal() 方法，性能更好
public class SafeBox<T> {
  private T value;
  private final ReentrantLock lock = new ReentrantLock();
  private final Condition valuePresent = lock.newCondition(); // 有值时的控制条件
  private final Condition valueAbsent = lock.newCondition(); // 没有值时的控制条件

  public void set(T newValue) throws InterruptedException {
    lock.lock();
    try {
      while (value != null) {
        valueAbsent.await();
      }
      value = newValue;
      valuePresent.signal();
    } finally {
      lock.unlock();
    }
  }

  public T get() throws InterruptedException {
    lock.lock();
    try {
      while (value == null) {
        valuePresent.await();
      }
      T result = value;
      value = null;
      valueAbsent.signal();
      return result;
    } finally {
      lock.unlock();
    }
  }
}

// 3. 使用 Guava 提供的 Monitor，内部使用了 ReentrantLock，写法上更灵活，不再需要手写 while 循环
public class SafeBox<T> {
  private final Monitor monitor = new Monitor();
  private final Monitor.Guard valuePresent = new Monitor.Guard(monitor) {
    public boolean isSatisfied() {
      return value != null;
    }
  };
  private final Monitor.Guard valueAbsent = new Monitor.Guard(monitor) {
    public boolean isSatisfied() {
      return value == null;
    }
  };
  private T value;

  public T get() throws InterruptedException {
    monitor.enterWhen(valuePresent);
    try {
      T result = value;
      value = null;
      return result;
    } finally {
      monitor.leave();
    }
  }

  public void set(T newValue) throws InterruptedException {
    monitor.enterWhen(valueAbsent);
    try {
      value = newValue;
    } finally {
      monitor.leave();
    }
  }
}

```



## Service



