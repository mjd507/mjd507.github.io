---
title: Guava 2 - Primitives & Strings
categories: Java
toc: true
comments: true
copyright: true
date: 2018-05-17 09:12:42
tags:
visible:
---

Guava 对基本数据类型常用的操作进行了封装，命名也很好记，Int 类型的封装类取之为 Ints，long 类型的封装类取名为 Longs。

<!--more-->

## 原始类型常用方法

```java
// ------------------------------- 以 Ints 为例--------------------------------- //
Ints.min(int... array); Ints.max(int... array) // 返回最小/大数
Ints.concat(int[]... arrays) // 合并多个数组
Ints.reverse(int[] array) // 反转数组元素
Ints.toArray(Collection<? extends Number> collection) // 转换为数组
Ints.asList(int... backingArray) // 转换为集合
Ints.contains(int[] array, int target) // 是否包含子元素
Ints.indexOf(int[] array, int[] target) // 子数组角标
Ints.join(String separator, int... array) // 以特定分隔符连接 int 数组
```

------

## 字符串相关

```java
// ------------------------------- Strings --------------------------------- //
String nullToEmpty(@Nullable String string);
String emptyToNull(@Nullable String string);
boolean isNullOrEmpty(@Nullable String string);
padStart(String string, int minLength, char padChar);//串头填充 padStart("7", 3, '0') => "007"
padEnd(String string, int minLength, char padChar); //串尾填充 padEnd("4.", 5, '0') => "4.000"
repeat(String string, int count);// repeat("hey", 3) => "heyheyhey"
commonPrefix(CharSequence a, CharSequence b); //共同前缀
commonSuffix(CharSequence a, CharSequence b); //公共后缀
```



```java
// ------------------------------- Joiner --------------------------------- //
// 一般连接字符串，过滤 null 的做法
public String join(List<Integer> list, String separator) {
  StringBuilder builder = new StringBuilder();
  list.forEach(item->builder.append(item).append(separator));
  builder.setLength(builder.length() - 1);
  return builder.toString();
}
// guava 提供了 Joiner ，链式操作，并且可跳过 null
Joiner joiner = Joiner.on("; ").skipNulls();
return joiner.join("Harry", null, "Ron", "Hermione"); // "Harry; Ron; Hermione".

Joiner.on(",").join(Arrays.asList(1, 5, 7)); // "1,5,7"

Joiner.on("&").withKeyValueSeparator("=").join(ImmutableMap.of("id", "1", "name", "kotlin")); // id=1&name=kotlin  常用于 http get 请求参数的拼接
```

## Splitter

```java
// ------------------------------- Splitter --------------------------------- //
// 针对 JDK 内建的字符串拆分工具有一些古怪的特性, 比如会忽略尾部的空字符串 
",a,,b,".split(","); // 返回 "","a","","b"

//  guava 提供了 Splitter ，链式操作，并且可过滤空串
Splitter.on(",").trimResults().omitEmptyStrings().split("foo,bar,,   qux"); // [foo, bar, qux]

Splitter.on("&").withKeyValueSeparator("=").split("id=1&name=kotlin"); // {id=1, name=kotlin} 常用于 url 参数的解析
```

