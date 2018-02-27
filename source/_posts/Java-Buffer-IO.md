---
title: IO 流的一些优化
categories: Java
toc: true
comments: true
copyright: true
date: 2018-02-26 21:09:18
tags:
---

Java 中，IO 流的 read 和 write 方法都是消耗系统资源的操作，多数操作系统在系统级进行了优化，比如在进行写文件的时候，先将字节存储到内核缓冲里，当流关闭或刷新时，再将内核缓冲的内容写入磁盘。

关于系统级的优化，这里不深入了，整理一下应用中 IO 的优化知识，主要是缓冲流的一些注意点。在 Socket 编程以及文件的读写操作等，缓冲流尤为重要。

<!--more-->

## ByteArrayOutputStream

我们在读写数据时，都应该使用缓冲流，对于二进制数据的文件，使用 BufferedInputStream 或 BufferedOutputStream；对于字符数据的文件，使用 BufferedReader 或 BufferedWriter，来包装底层的流。

但用到 ByteArrayInputStream 和 ByteArrayOutputStream 的时候，情况就不一样了，这两个流自带缓冲区，如果我们再用缓冲流包装，意味着数据会被复制两次，这是多余的操作。

```java
//将当期日期写入 ByteArrayOutputStream 中
public static void writeDate() throws IOException {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    ObjectOutputStream oos = new ObjectOutputStream(baos);
    oos.writeObject(new Date());
    oos.close();
}
```



## GZIPOutputStream

对于一些比较大的文件，在写之前进行压缩，效率会更高。

```java
//将文件对象压缩后，写入 ByteArrayOutputStream 中
public void writeZipFile(Object obj) throws IOException {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    GZIPOutputStream zip = new GZIPOutputStream(baos);
    ObjectOutputStream oos = new ObjectOutputStream(zip);
    oos.writeObject(obj);
    oos.close();
    zip.close();
}
```

ObjectOutputStream 将数据发给 GZIPOutputStream ，压缩后，写入到 ByteArrayOutputStream 里。

这里，虽然使用了缓冲流 ByteArrayOutputStream，但是 ObjectOutputStream 在写数据到缓冲流中时，先经过了 GZIPOutputStream 压缩，所以这个写操作实际还是操作的单个字节的数据，这里，就应该引入 

BufferedOutputStream 缓冲流。

```java
//将文件对象压缩后，写入 ByteArrayOutputStream 中, 增加 BufferedOutputStream 缓冲流
public void writeZipFile(Object obj) throws IOException {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    GZIPOutputStream zip = new GZIPOutputStream(baos);
    BufferedOutputStream bos = new BufferedOutputStream(zip);
    ObjectOutputStream oos = new ObjectOutputStream(bos);
    oos.writeObject(obj);
    oos.close();
    zip.close();
}
```

到底何时使用 BufferedOutputStream 呢？

上面的两个例子中，如果 ObjectOutputStream 的下一个流是最终的流，比如 ByteArrayOutputStream，那么就不需要使用 BufferedOutputStream，如果中间还有其他的流，比如 GZIPOutputStream，就需要使用 BufferedOutputStream。

其实并没有统一的规则，操作一块数据总比操作一系列单个字节的数据效率要高。

有人做过测试，使用压缩流的情况下，序列化/反序列化 1w 个对象，使用 缓冲流 的效率是不使用缓冲流的 6 倍。

##相关阅读

[Java 性能权威指南](https://pan.baidu.com/s/1kWJSptt)