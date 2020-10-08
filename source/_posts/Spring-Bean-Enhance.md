---
title: Spring Bean 增强
categories: Back-End
toc: true
comments: true
copyright: true
visible: true
date: 2019-07-06 10:39:25
tags:
---

spring bean 的增强，具体体现在 Aspect 切面拦截 与 Transactional 事务上。

<!--more-->

在 [spring bean的加载](https://mjd507.github.io/2019/06/30/spring-bean/) 中，bean 初始化**之后**会调用 applyBeanPostProcessorsAfterInitialization() 方法，该方法即可以 bean 进行增强，通过调用 BeanPostProcessors 的 postProcessAfterInitialization() 方法。

当 Application 开启了切面代理（@EnableAspectJAutoProxy）或者事务管理(@EnableTransactionManagement) 的时候，会在系统内注册一个 AutoProxyCreator ，这是一个 processer，看下它在 bean 初始化后增强的具体代码。


## AbstractAutoProxyCreator

```java
@Override
public Object postProcessAfterInitialization(@Nullable Object bean, String beanName) {
  if (bean != null) {
    Object cacheKey = getCacheKey(bean.getClass(), beanName);
    if (!this.earlyProxyReferences.contains(cacheKey)) {
      return wrapIfNecessary(bean, beanName, cacheKey);
    }
  }
  return bean;
}

protected Object wrapIfNecessary(Object bean, String beanName, Object cacheKey) {
  // ...
  // Create proxy if we have advice.
  Object[] specificInterceptors = getAdvicesAndAdvisorsForBean(bean.getClass(), beanName, null);
  if (specificInterceptors != DO_NOT_PROXY) {
    this.advisedBeans.put(cacheKey, Boolean.TRUE);
    Object proxy = createProxy(
        bean.getClass(), beanName, specificInterceptors, new SingletonTargetSource(bean));
    this.proxyTypes.put(cacheKey, proxy.getClass());
    return proxy;
  }
  // ...
}

```

getAdvicesAndAdvisorsForBean 决定了 bean 是否需要增强，如果需要，会将这个 bean 的 Advices 和 Advisors 都拿出来，用来创建代理对象。

Advisors 就是容器中存在的 AspectBean ， Advices 就是 AspectBean 中的 before 和 after 方法。

createProxy 方法内通过调用一个 ProxyFactory 来获取代理对象，ProxyFactory 会通过 ProxyCreatorSupport 来创建一个默认的 DefaultAopProxyFactory。


## DefaultAopProxyFactory

```java
@Override
public AopProxy createAopProxy(AdvisedSupport config) throws AopConfigException {
  if (config.isOptimize() || config.isProxyTargetClass() || hasNoUserSuppliedProxyInterfaces(config)) {
    Class<?> targetClass = config.getTargetClass();
    if (targetClass == null) {
      throw new AopConfigException("TargetSource cannot determine target class: " +
          "Either an interface or a target is required for proxy creation.");
    }
    if (targetClass.isInterface() || Proxy.isProxyClass(targetClass)) {
      return new JdkDynamicAopProxy(config);
    }
    return new ObjenesisCglibAopProxy(config);
  }
  else {
    return new JdkDynamicAopProxy(config);
  }
}
```

代理工厂会根据配置与目标对象的类型，选择用JDK动态代理，还是CGLIB的代理。


------

之前在整理 [Spring AOP](https://mjd507.github.io/2018/09/12/Spring-AOP/) 时，比较了 jdk 与 cglib 的区别。还有那张代理对象创建流程图也有，这里在贴一下。

![Spring 创建 bean 代理](https://user-images.githubusercontent.com/8939151/45362760-46494280-b608-11e8-9aa7-c874ac3b5e56.png)

