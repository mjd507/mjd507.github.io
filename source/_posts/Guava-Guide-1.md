---
title: Guava 1 - Basic Utilities & EventBus
categories: Java & Android
toc: true
comments: true
copyright: true
date: 2018-05-12 10:25:48
tags:
visible:
---

Guava，官方解释：「Google core libraries for Java」，Guava 是一组核心库，包括新的集合类型（如 multimap 和multiset），不可变集合，图形库，函数类型，内存缓存，以及用于并发，I / O，哈希，原始类型数据，反射，字符串处理等 API 。

我按照其 wiki 文档，阅读其源代码，整理出几篇列表，方便使用。这篇是 guava 基本的实用功能以及事件通信组件 EventBus。

<!--more-->

## 关于 null 的处理

```java
// -------------------------------Preconditions--------------------------------- //
// 空对象，不为 true 的表达式，违法参数，程序多数直接不处理，一般的做法
if (obj == null) {
  return;
}
if (!expression) {
  return false;
}
// guava 使用 Preconditions 预检查，封装成一句话
checkNotNull(value, "value is null"); // 如果不满足，throw NullPointerException
checkArgument(i >= 0, "Argument was %s but expected nonnegative", i); // 如果不满足，throw IllegalArgumentException
checkState(expression); // 如果不满足，throw IllegalStateException

// -------------------------------Strings--------------------------------- //
// 对于字符串的空的情况，一般做法
string == null || string.isEmpty();
// guava 提供了 Strings 类，对字符串空检查和转换
isNullOrEmpty(String string) // 判断空或""
nullToEmpty(String string) // null -> ""
emptyToNull(String string) // "" -> null

// -------------------------------Optional--------------------------------- //
// guava 提供了 Optional 赋予 null 语义，促使开发者关注 null 时的情况。
List resList = Optional.fromNullable(list).or(new ArrayList<String>()); // list 若为 null,则新建一个 ArrayList 返回
boolean present = Optional.fromNullable(list).isPresent(); // list 若为 null, 则返回 true

// -------------------------------MoreObjects--------------------------------- //
MoreObjects.firstNonNull(list1,list2); // 返回第一个不为 null 的对象，若都为 null, throw NullPointerException
```



## Object Method

```java
// -------------------------------ComparisonChain--------------------------------- //
// 一般可比较对象的 compareTo 写法
public class Person implements Comparable<Person> {
  private String lastName;
  private String firstName;
  private int zipCode;
  @Override
  public int compareTo(Person other) {
    int cmp = lastName.compareTo(other.lastName);
    if (cmp != 0) {
      return cmp;
    }
    cmp = firstName.compareTo(other.firstName);
    if (cmp != 0) {
      return cmp;
    }
    return Integer.compare(zipCode, other.zipCode);
  }
}
// guava 提供了 ComparisonChain 链式比较
@Override
public int compareTo(Person other) {
  return ComparisonChain.start()
    .compare(lastName, other.lastName)
    .compare(firstName, other.firstName)
    .compare(zipCode, other.zipCode)
    .result();
}
// -------------------------------toStringHelper--------------------------------- //
// Returns "ClassName{x=1}"
MoreObjects.toStringHelper(this).add("x", 1).toString();
// Returns "MyObject{x=1}"
MoreObjects.toStringHelper("MyObject").add("x", 1).toString();

```



## Ordering

guava 提供的排序功能，这里更推荐 Java 8 中的 Stream() 和 Comparator 里面提供的比较器来代替。

```java
// -------------------------------Stream & Comparator--------------------------------- //
list.stream().sorted(); // 自然排序
list.stream().sorted(Comparator.reverseOrder()); // 自然逆序排序
list.stream().sorted(Comparator.comparing(Student::getAge)); // 按年龄排序
list.stream().sorted(Comparator.comparing(Student::getAge).reversed()); // 按年龄逆序排序
```



## Throwables

个人没理解 guava 的作者们对 Throwables 进行 Propagation 的意义，暂不整理。可参见其官方 wiki ：https://github.com/google/guava/wiki/ThrowablesExplained



## EventBus

- EventBus 在设计上，没有使用单例，允许实例化多个 bus 。
- 使用 @Subscribe 注解来标记事件订阅的处理方法；并将这些方法缓存；该方法只能有一个参数。
- register(obj) 和 post(obj) 参数都是 Object 类型，register 的 obj 需包含带有注解的事件处理方法，以及具体的事件对象参数，post 的 obj 只需要具体的事件对象。We see this as a feature, not a bug :)
- 如果 register 事件，但没有任何处理函数，那么什么也不会发生；可以使用 DeadEvent，在里面注册一个处理没有订阅的方法，简单打印下没注册的事件。

```java
// 官方精简示例
// Class is typically registered by the container.
class EventBusChangeRecorder {
  @Subscribe 
  public void recordCustomerChange(ChangeEvent e) {
    recordChange(e.getChange());
  }
}
// somewhere during initialization
eventBus.register(new EventBusChangeRecorder());
// much later
public void changeCustomer()
  ChangeEvent event = getChangeEvent();
  eventBus.post(event);
}
```

```java
// 自己测试示例
public static void main(String args[]) {
  EventBus bus = new EventBus();
  bus.register((UserListener) userInfoEvent -> {
    String userInfo = userInfoEvent.getUserInfo();
    System.out.println(userInfo);
  });
  bus.post(new UserInfoEvent("jay"));
  bus.post(new UserInfoEvent("kit"));
  bus.post(new UserInfoEvent("luck"));
}

interface UserListener {
  @Subscribe
  void refreshUser(UserInfoEvent userInfo);
}

static class UserInfoEvent {
  String userInfo;
  public UserInfoEvent(String userInfo) {
    this.userInfo = userInfo;
  }
  public String getUserInfo() {
    return userInfo;
  }
}
```



