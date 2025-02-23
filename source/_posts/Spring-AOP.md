---
title: Spring AOP
categories: Big-Back-End
toc: true
comments: true
copyright: true
visible: true
date: 2018-09-11 19:13:55
tags:
---

整理两种代理的简单实现，各自优缺点，以及 Spring 对两种 aop 代理的选择。

<!--more-->

## JDK Proxy （基于接口的代理）
------
```java
interface Hello {
  void sayHello();
}

class HelloImpl implements Hello {
  @Override
  public void sayHello() {
    System.out.println("Hello World");
  }
}

class MyInvocationHandler implements InvocationHandler {
  private Object target;
  public MyInvocationHandler(Object target) {
    this.target = target;
  }
  @Override
  public Object invoke(Object proxy, Method method, Object[] args) throws Throwable{
    System.out.println("Before invoke ...");
    Object result = method.invoke(target, args);
    System.out.println("After invoke ...");
    return result;
  }
}

public static void main(String[] args) {
  Hello Hello = new HelloImpl();
  MyInvocationHandler handler =  new MyInvocationHandler(Hello);
  Hello proxyHello = (Hello) Proxy.newProxyInstance(HelloImpl.class.getClassLoader(), HelloImpl.class.getInterfaces(), handler);
  proxyHello.sayHello();
}

-------
Before invoke ...
Hello World
After invoke ...

```

JDK 动态代理的大致过程

1. Proxy.newProxyInstance
2. getProxyClass0   ProxyClassFactory   ProxyGenerator 生成代理类的字节码，可在 main 方法执行时，添加 `System.getProperties().put("sun.misc.ProxyGenerator.saveGeneratedFiles", "true");` 生成代理类字节码文件。
3. newInstance

## Cglib  (不依赖接口)

```java
public class HelloImpl {
  public void sayHello() {
    System.out.println("Hello World");
  }
}

public class MyCglibInterceptor implements MethodInterceptor {
  @Override
  public Object intercept(Object obj, Method method, Object[] args, MethodProxy methodProxy) throws Throwable {
    System.out.println("before cglib invoke ...");
    Object result = methodProxy.invokeSuper(obj, args);
    System.out.println("after cglib invoke ...");
    return result;
  }
}

public class CglibProxy {
  public static void main(String[] args) {
    Enhancer enhancer = new Enhancer();
    enhancer.setSuperclass(HelloImpl.class);
    enhancer.setCallback(new MyCglibInterceptor());
    HelloImpl hello = (HelloImpl) enhancer.create();
    hello.sayHello();
  }
}

------
before cglib invoke ...
Hello World
after cglib invoke ...
```

Cglib 基于继承来实现代理，无法对 static 、final 类进行代理，也无法对 private 、static 方法进行代理。



## Spring 对两种代理的选择

JDK 动态代理是实现了被代理类对象的接口，cglib 是继承了被代理的对象。

JDK 和 cglib 代理都是在运行期生成字节码，JDK 是直接写 Class 字节码，cglib 使用 asm 框架写字节码，生成代理类的效率比 jdk 低。

JDK 调用代理方法，是通过反射机制调用，cglib 是通过 FastClass 机制直接调用刚发，cglib 执行效率更高。

![Spring 创建 bean 代理](https://user-images.githubusercontent.com/8939151/45362760-46494280-b608-11e8-9aa7-c874ac3b5e56.png)

```java
// DefaultAopProxyFactory.java
public AopProxy createAopProxy(AdvisedSupport config) throws AopConfigException {
  if (!config.isOptimize() && !config.isProxyTargetClass() && !this.hasNoUserSuppliedProxyInterfaces(config)) {
    return new JdkDynamicAopProxy(config);
  } else {
    Class<?> targetClass = config.getTargetClass();
    if (targetClass == null) {
      throw new AopConfigException("TargetSource cannot determine target class: Either an interface or a target is required for proxy creation.");
    } else {
      return (AopProxy)(!targetClass.isInterface() && !Proxy.isProxyClass(targetClass) ? new ObjenesisCglibAopProxy(config) : new JdkDynamicAopProxy(config));
    }
  }
}

```

如果目标对象实现了接口，则默认采用 JDK 动态代理

如果目标对象没有实现接口，则采用 cglib 动态代理

如果目标对象实现了接口，且强制 cglib 代理，则使用 cglib 代理 。强制开启 cglib 代理方法，加上 `@EnableAspectJAutoProxy(proxyTargetClass = true)`



