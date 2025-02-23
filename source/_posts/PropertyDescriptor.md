---
title: 'PropertyDescriptor'
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2025-02-23 18:09:32
tags:
---


learn 4 class from JDK.

java.beans.Introspector;
java.beans.BeanInfo;
java.beans.PropertyDescriptor;
java.beans..MethodDescriptor;

<!--more-->


```uml
classDiagram
    class Introspector {
        +getBeanInfo(Class<?> beanClass): BeanInfo
    }
    class BeanInfo {
        +getPropertyDescriptors(): PropertyDescriptor[]
        +getMethodDescriptors(): MethodDescriptor[]
    }
    class PropertyDescriptor {
        -name: String
        -propertyType: Class<?>
        -readMethod: Method
        -writeMethod: Method
        +getName(): String
        +getPropertyType(): Class<?>
        +getReadMethod(): Method
        +getWriteMethod(): Method
    }
    class MethodDescriptor {
        -method: Method
        +getMethod(): Method
    }
    class Method {
        +invoke(Object obj, Object... args): Object
    }

    Introspector --> BeanInfo : creates
    BeanInfo "1" *-- "*" PropertyDescriptor : contains
    BeanInfo "1" *-- "*" MethodDescriptor : contains
    PropertyDescriptor --> Method : has readMethod
    PropertyDescriptor --> Method : has writeMethod
    MethodDescriptor --> Method : has method
```