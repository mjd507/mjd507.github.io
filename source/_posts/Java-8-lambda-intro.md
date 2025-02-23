---
title: Java8 中的 lambda 表达式入门
categories: Big-Back-End
toc: true
comments: true
copyright: true
date: 2018-03-16 21:04:05
tags:
visible:
---

这次的图片是「白色布莱斯湖」，来自 [Riccardo Chiarini](https://unsplash.com/@riccardoch) 之手，摄影于「布雷斯湖 · 意大利」。湖水平均深度为 17 米。 最深处的点位于 36 米处，是意大利最深的湖泊之一。图中此时的湖面已经完全被雪冻结。

<!--more-->

![White Desert <br/> Location: Braies Lake, Italy.  By Riccardo Chiarini](https://user-images.githubusercontent.com/8939151/111025327-6565fc80-841e-11eb-89e3-9885581ca748.png)





## 函数式接口

lambda 表达式与 js 的函数式编程很像，但还没 js 灵活，毕竟 Java 是一种强类型语言。书写 lambda 表达式的前提是定义接口，以及接口内方法参数和返回值，比如 Java 系统类自带的 Runnable 接口。

```java
@FunctionalInterface
public interface Runnable {
    public abstract void run();
}
```

@FunctionalInterface 只是一个函数接口声明，不写也不影响程序运行，只是提醒调用者，这里可以使用 lambda 表达式。

```java
Thread myLambdaThread = new Thread(() -> System.out.println("Printed inside Runnable"));
myLambdaThread.run();

//输出
Printed inside Runnable
```

上面的 lambda 表达式，简化了原先匿名内部类的写法，并且代码的可读性也更强了。Runnable 中的 run() 方法是没有参数和返回值的，如果有，假设接口方法为 int add(int a, int b)，那么 lambda 表达式为 (a,b) -> { return a+b }

Java 为我们提供了很多函数式接口，放在 java.util.function 包下面，因此很多时候，不需要特地定义接口在使用 lambda  表达式，直接用系统提供的就行。

比如 Consumer<T> 接口，就定义了一个 acceptt(T t)方法。



## 闭包

```java
private static void doProcess(int a, Consumer<Integer> consumer) {
    consumer.accept(a);
}
public static void main(String[] args) {
    int a = 10;
    int b = 20;
    doProcess(a, (i) -> System.out.println(i + b));
}
```

lambda 简化了匿名内部类，上面代码中的变量 b 会被隐式的加上 final 修饰符，即 b 不可以改变。

```java
doProcess(a, (i) -> {
  // b = 30; 报错
  System.out.println(i + b);
});
```



## 异常处理

```java
private static void process(int[] someNumbers, int key, BiConsumer<Integer, Integer> consumer) {
  for (int i : someNumbers) {
    consumer.accept(i, key);
  }
}
public static void main(String[] args) {
  int[] someNumbers = {1, 2, 3, 4};
  int key = 0;
  process(someNumbers, key, (v, k) -> System.out.println(v / k));
}
```

上面代码，因为除数为 0，所以会报 ArithmeticException 异常，比较好的处理方法是对 lambda 表达式包装一层。

```java
process(someNumbers, key, wrapperLambda((v, k) -> System.out.println(v / k)));
private static BiConsumer<Integer, Integer> wrapperLambda(BiConsumer<Integer, Integer> consumer) {
  return (v, k) -> {
    try {
      consumer.accept(v, k);
    } catch (ArithmeticException e) {
      System.out.println("A Arithmetic Exception Happened");
    }
  };
}
```



## this 引用

```java
private void doProcess(int i, Consumer<Integer> consumer) {
  consumer.accept(i);
}
public static void main(String[] args) {
  ThisReferenceExample thisRefEx = new ThisReferenceExample();
  thisRefEx.doProcess(10, i -> {
    System.out.println("Value of i is: " + i);
    // System.out.println(this); this will not work
    System.out.println("Can not print this in a static method");
  });

  thisRefEx.execute();
}
// lambda 表达式在静态方法中，无法获取 this 引用
输出： 
Value of i is: 10
Can not print this in a static method
```

使用匿名内部类

```java
public static void main(String[] args) {
  ThisReferenceExample thisRefEx = new ThisReferenceExample();
  thisRefEx.doProcess(10, new Consumer<Integer>() {
    @Override
    public String toString() {
      return "this is point to a anonymous inner class";
    }
    @Override
    public void accept(Integer i) {
      System.out.println("Value of i is: " + i);
      System.out.println(this);
    }
  });
}
// lambda 表达式在匿名内部类中， this 指向当前内部类
输出： 
Value of i is: 10
this is point to a anonymous inner class
```

使用成员方法

```java
public static void main(String[] args) {
  ThisReferenceExample thisRefEx = new ThisReferenceExample();
  thisRefEx.execute();
}
private void execute() {
  this.doProcess(10, i -> {
    System.out.println("Value of i is: " + i);
    System.out.println(this);
  });
}
// lambda 表达式在成员方法中， this 指向当前类
输出： 
Value of i is: 10
this is point to ThisReferenceExample class
```



## 方法引用

lambda 表达式如果是调用类中已定义好的方法，可以简写成 类名::方法名

```java
private static void printMsg() {
  System.out.println("Hello");
}
public static void main(String[] args) {
  // Thread thread = new Thread(()-> printMsg());
  Thread thread = new Thread(MethodReferenceExample::printMsg);
  thread.run();
}
```



## 集合操作

Java 8 开始，集合操作更加灵活，配合 stream 和 lambda 表达式，

```java
public static void main(String[] args) {
  String[] arr = {"a", "b", "c"};
  List<String> list = Arrays.asList(arr);

  // list.forEach(s -> System.out.println(s));
  list.forEach(System.out::println);
}
```

```java
public static void main(String[] args) {
  String[] arr = {"aa", "ab", "ac", "bd", "be", "de"};
  List<String> list = Arrays.asList(arr);
  
  list.stream()
  .filter(s->s.startsWith("b"))
  .forEach(System.out::println);
}
```



