---
title: Java 注解入门
categories: Java & Android
toc: true
comments: true
copyright: true
date: 2018-03-01 19:16:47
tags:
---

注解（Annotation），也叫元数据。是一种代码级别的说明。JDK1.5及以后版本引入的一个特性，与类、接口、枚举是在同一个层次。它可以声明在包、类、字段、方法、局部变量、方法参数等的前面，用来对这些元素进行说明，注释。

<!--more-->

## 定义注解

使用关键字`@interface`来声明一个注解类；

@Retention 用来说明该注解类的生命时长；当注解类型声明中没有 @Retention 元注解时，默认为 RetentionPolicy.CLASS，即注解存在于源文件和编译后的字节码文件中，运行时不再保留。此外还有 RetentionPolicy.SOURCE (注解仅存在与源文件中)，RetentionPolicy.RUNTIME (注解存在于源文件、字节码文件、运行时 VM 中) 两个保留策略。

@Target来声明注解目标所适用的程序元素的种类。其 ElementType 的枚举类型有 `ANNOTATION_TYPE`, CONSTRUCTOR, FIELD, LOCAL_VARIABLE, METHOD, PACKAGE, PARAMETER, TYPE。

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Person {
    String name();
    int age();
}
```

这里声明一个 Person 的注解，在运行时作用于方法上，并定义两个注解方法。这里有一些规则：

1. 注解方法不能带参数，比如`name()`，age()
2. 注解方法返回值类型：基本类型、String、Enums、Annotation以及前面这些类型的数组类型
3. 注解方法可有默认值，比如 String name() default "zhangsan"。

有了注解，就可以开始在方法体上使用它了。

```java
public class PersonTest {
    @Person(name = "张三", age = 20)
    public void method_1() {
    }

    @Person(name = "李四", age = 21)
    public void method_2() {
    }
}
```



## 解析注解

这里想把前面方法体上注解的内容全部读取出来。就需要用到反射来解析。关于反射相关的方法使用，可以参考 JDK 文档 java.lang.reflect 包中的内容。

前面自定义的 Person 注解，作用于方法上，适用对象为 Method，Method 类继承自 AccessibleObject，AccessibleObject 实现了 AnnotatedElement 接口，这个接口定义了操作注解相关的几个核心方法：

>isAnnotationPresent(Class<? extends Annotation> annotationClass)  判断该元素是否存在指定类型注解
>
>getAnnotation(Class annotationClass)   返回该元素上指定类型注解的对象
>
>getAnnotations()  返回此元素上存在的所有注解
>
>getDeclaredAnnotations() 返回直接存在于此元素上的所有注解

这里通过遍历类的所有方法，来获取定义的注解的值。

```java
public class PersonParser {

    public List<Person> getPersons() {
        List<Person> list = new ArrayList<>();
        try {
            Class<?> clazz = this.getClass().getClassLoader().loadClass("PersonTest");
            Method[] methods = clazz.getMethods();
            for (Method method : methods) {
                if (method.isAnnotationPresent(Person.class)) {
                    Person person = method.getAnnotation(Person.class);
                    list.add(person);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

}
```

写个入口执行，看下输出结果：

```java
public static void main(String args[]) {
    PersonParser parser = new PersonParser();
    List<Person> persons = parser.getPersons();
    for (Person person : persons) {
        System.out.println(person.name() + ":" + person.age());
    }
}

============== 输出结果 ============
张三:20
李四:21

Process finished with exit code 0
```



## 参考阅读

[Java注解(Annotation)](http://gityuan.com/2016/01/23/java-annotation/)