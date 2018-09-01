---
title: Java 反射的使用场景
categories: Java
toc: true
comments: true
copyright: true
visible: true
date: 2018-09-01 11:01:58
tags:
---

个人对 Java 反射这块，还不透，先把项目里用到反射的场景以及简单的原理和实现整理，肯定不全，等待时间添加新的理解。反射在运行时操作对象，当配合注解，动态代理等一同使用，使得开发更专注业务。

<!--more-->

看到网上有个例子，也是讲反射的，说 Java IDE 的代码自动提示即采用了反射来提示类中的成员，也有人指出说大部分是采用语法树来实现的。

## 实体属性拷贝

从数据库读取的 UserDo 实体，字段很多，但不需要都返回前端，于是定义了一个 UserVo，将 UserVo 的字段设置成 UserDo 里对应字段的值。代码里很多这样模板式的对应赋值，如果都 new UserVo() 在赋值，阅读性很差，于是出现了很多框架，比如 Spring 的 BeanUtils，Apache 的 BeanUtils 等。将属性 copy 简化成一句代码。

```java
copyProperties(Object source, Object target);
```

项目里可以对其简单封装下，搞一个 CopyUtils 工具类，在需要 copy 的地方，直接像如下调用

```java
UserDo userDo = ... 
UserVo userVo = CopyUtils.copyObject(userDo, UserVo.class);
```

如果我来写 copyProperties 的实现，大致思路如下：获取源对象的所有字段，获取待赋值对象的所有字段，通过遍历，如果源对象的属性名 equals 目标对象的属性名，则获取源对象属性的值，并赋给目标对象该属性。

```java
public static <S, T> T copyProperties(S s, Class<T> t) throws IllegalAccessException, InstantiationException {
  Field[] originFields = s.getClass().getDeclaredFields();
  T targetBean = t.newInstance();
  Field[] targetFields = t.getDeclaredFields();
  for (Field target : targetFields) {
    for (Field origin : originFields) {
      if (origin.getName().equals(target.getName())) {
        origin.setAccessible(true);
        Object value = origin.get(s);
        target.setAccessible(true);
        target.set(targetBean, value);
        break;
      }
    }
  }
  return targetBean;
}
```

Spring 的 BeanUtils 的 copyProperties 思路类似，处理的比较细致，使用了 PropertyDescriptor 来读写属性。

## 反射 + 注解

半年前整理过一篇注解入门的文章，很基础，现在回看还可以，贴下链接：https://mjd507.github.io/2018/03/02/Java-Annotation/ 当反射配合上注解，使用的场景就更多了。

1. 单元测试的 @Test 注解，相当于测试的一个入口，使用反射来解析，获取到测试的方法，从而 invoke 该方法。
2. Spring 的依赖注入。@Component，@Autowired 等。以及 Google 的 Guice 依赖注入框架。

```java
// 最常见的 @Autowired ，可以基于成员变量注入，基于构造方法注入，基于 set 方法注入
@Autowired
private MessageService service;

// 如果不利用注解和反射去注入，那就需要手动 new 对象
private  MessageService service = new MessageServiceImpl();
```



