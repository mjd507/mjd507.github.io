---
title: JDK 7 中的 Try-With-Resource
categories: Java & Android
toc: false
comments: true
copyright: true
date: 2018-03-12 20:47:39
tags:
visible:
---

这次的图片是「雪后山上徒步旅行者」，来自 Dino Reichmuth 之手，摄影于「瑞士 · 菲舍塔尔 · 阿莱奇冰川」，阿莱奇冰川是阿尔卑斯山脉最大的冰川，是世界文化遗产少女峰-阿莱奇区域的中心部分。可惜的是，与瑞士其他冰川一样，越来越短了。

<!--more-->

![Mountain hiker in snow <br/> Location: Aletsch Glacier, Fieschertal, Switzerland. <br/>  By Dino Reichmuth](https://user-images.githubusercontent.com/8939151/111025383-af4ee280-841e-11eb-82cd-267cbb99c53e.png)

------

JDK 7 中新增了对 Try-With-Resources 的支持，简单来讲，即可以在 try 的代码执行完毕后，对资源进行自动的释放，前提是资源实现了 AutoCloseable 接口。

Java IO 流体系中，Reader 和 Writer 都实现了 Closeable 接口，Closeable 继承自 AutoCloseable 接口，所以在 JDK 7 以及之后，对流的操作代码可以简化成这样：

```java
try (PrintWriter writer = new PrintWriter(new File("test.txt"))) {
  writer.println("Hello World");
}
```

这里，写法上稍微不同，资源必须在 try 中声明和初始化，才会自动关闭。

如果有多个资源，直接在 try 里面加分号分隔。

```java
try (Scanner scanner = new Scanner(new File("testRead.txt"));
    PrintWriter writer = new PrintWriter(new File("testWrite.txt"))) {
  while (scanner.hasNext()) {
    writer.print(scanner.nextLine());
  }
}
```

上面两个读写操作，都可以安全的释放资源，这里可以做个试验，看哪个资源先被释放。

```java
// 首先来自定义一个资源，实现 AutoCloseable 接口
static class MyResource implements AutoCloseable {

  String flag = "";

  MyResource(String flag) {
    this.flag = flag;
  }

  void write() {
    System.out.println("进行写操作" + flag);
  }

  void clear() {
    System.out.println("释放资源" + flag);
  }

  @Override
  public void close() throws Exception {
    this.clear();
  }
}
// 在 try 里创建两个对象资源
try (
    MyResource res1 = new MyResource("1");
    MyResource res2 = new MyResource("2")
) {
  res1.write();
  res2.write();
}
// 输出
进行写操作1
进行写操作2
释放资源2
释放资源1
```

可以看到，后申明的资源，最先被释放。

try-with-resources 代码块和传统的 try 模块一样，仍然可以使用 catch 和 finally 代码块。

