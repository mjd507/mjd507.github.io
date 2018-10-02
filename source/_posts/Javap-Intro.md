---
title: javap 小记
categories: Java
toc: true
comments: true
copyright: true
visible: true
date: 2018-10-02 13:50:50
tags:
---

![生态湖 · 浦软大厦 · 上海](http://blog.mjd507.cn/2018-09-23-ShengTaiHu.jpeg?imageView2/0/w/750/format/jpg/q/75|imageslim)

<!--more-->

## javap 查看字节码

javap 是一个能将 class 文件，反编成我们可读格式的工具。

假设有一个编译后的字节码文件 Foo.class
```shell
javap Foo // 打印所有非私有的字段和方法
javap -p Foo // 打印所有字段和方法 (包括 private)
javap -v Foo // 打印详细信息，分四个部分。
// 1. 基本信息：class 文件版本号(JRE版本)，类的访问权限，该类以及父类的名字，所实现接口，字段，方法以及属性的数目。这类信息通常被用于 Java 虚拟机的验证和运行
// 2. 常量池：存放各种常量以及符号引用。常量池的每一项都有一个索引，并且可能引用其他的常量池项。
// 3. 字段区域：用来列举类中的各个字段 (字段描述符 descriptor 以及访问权限 flags)
// 4. 方法区域：用来列举勒种的各个方法 (方法描述符 descriptor，访问权限 flages 以及 代码区域 Code)

// 如果仅想查看方法对应的字节码，可以用 -c 代替 -v
javap -c Foo // 打印方法对应的字节码信息
```

## 编译器对字符串的优化
```java
public static void main(String[] args) {
  String str = "aa" + "bb" + "cc" + "dd";  
  // 编译后的字节码 0: ldc           #2                  // String aabbccdd
  // 已经优化
}
```

```java
public static void main(String[] args) {
  String str = "aa" + "bb" + "cc" + "dd"; 
  System.out.println("My String:..." + str);
}
// str 这一行，仍被编译成 aabbccdd
// 输出这一行，在 jdk 8 中，会采用 StringBuilder 拼接
 0: ldc           #2                  // String aabbccdd
 2: astore_1
 3: getstatic     #3                  // Field java/lang/System.out:Ljava/io/PrintStream;
 6: new           #4                  // class java/lang/StringBuilder
 9: dup
10: invokespecial #5                  // Method java/lang/StringBuilder."<init>":()V
13: ldc           #6                  // String My String:...
15: invokevirtual #7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
18: aload_1
19: invokevirtual #7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
22: invokevirtual #8                  // Method java/lang/StringBuilder.toString:()Ljava/lang/String;
25: invokevirtual #9                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V

// 在 jdk 9 以上，提供了 StringConcatFactory 
 0: ldc           #2                  // String aabbccdd
 2: astore_1
 3: getstatic     #3                  // Field java/lang/System.out:Ljava/io/PrintStream;
 6: aload_1
 7: invokedynamic #4,  0              // InvokeDynamic #0:makeConcatWithConstants:(Ljava/lang/String;)Ljava/lang/String;
12: invokevirtual #5                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
15: return
```
