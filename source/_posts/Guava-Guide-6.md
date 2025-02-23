---
title: Guava 6 - Reflection
categories: Big-Back-End
toc: true
comments: true
copyright: true
visible: true
date: 2018-08-05 15:41:33
tags:
---

Guava 对反射相关的操作提供封装。

<!--more-->

## 运行时捕获类型

```java
// Java 会在运行时擦除泛型
List<String> stringList = Lists.newArrayList();
List<Integer> intList = Lists.newArrayList();
boolean result = stringList.getClass().isAssignableFrom(intList.getClass());
assertTrue(result);

// Guava 提供 TypeToken (基于反射获取泛型方法返回类型，ParameterizedType 表示 List<T>)
TypeToken<List<String>> stringListToken = new TypeToken<List<String>>() {};
TypeToken<List<Integer>> integerListToken = new TypeToken<List<Integer>>() {};
TypeToken<List<? extends Number>> numberTypeToken = new TypeToken<List<? extends Number>>() {};

assertFalse(stringListToken.isSubtypeOf(integerListToken));
assertFalse(numberTypeToken.isSubtypeOf(integerListToken));
assertTrue(integerListToken.isSubtypeOf(numberTypeToken)); //an Integer class extends a Number class.
```



## Invokable

对 Method 和 Constructor 的操作提供了方便的 api.

```java
// JDK 判断方法是否是 public ，是否是 package private， 是否可被子类重写
Modifier.isPublic(method.getModifiers());
!(Modifier.isPrivate(method.getModifiers()) || Modifier.isPublic(method.getModifiers()));
!(Modifier.isFinal(method.getModifiers())
    || Modifiers.isPrivate(method.getModifiers())
    || Modifiers.isStatic(method.getModifiers())
    || Modifiers.isFinal(method.getDeclaringClass().getModifiers()))
// Guava:
invokable.isPublic();
invokable.isPackagePrivate();
invokable.isOverridable();

// JDK 判断第一个参数注解是否为 @Nullable
for (Annotation annotation : method.getParameterAnnotations()[0]) {
  if (annotation instanceof Nullable) {
    return true;
  }
}
return false;
// Guava:
invokable.getParameters().get(0).isAnnotationPresent(Nullable.class);
```



## Dynamic Proxies

```java
// JDK 动态代理
Foo foo = (Foo) Proxy.newProxyInstance(
    Foo.class.getClassLoader(),
    new Class<?>[] {Foo.class},
    invocationHandler);
// Guava 
Foo foo = Reflection.newProxy(Foo.class, invocationHandler);
```

