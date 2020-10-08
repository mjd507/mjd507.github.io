---
title: spring bean 的加载
categories: Back-End
toc: true
comments: true
copyright: true
visible: true
date: 2019-06-29 19:02:48
tags:
---

简单整理下 spring bean 的加载

<!--more-->

## createBean

```java
// AbstractAutowireCapableBeanFactory.java#createBean(xxx)
// ...
try {
  // Give BeanPostProcessors a chance to return a proxy instead of the target bean instance.
  // 用 BeanPostProcessors 返回代理来替代真正的实例（如果 Bean 配置了 PostProcessor，那么这里返回的是一个代理）
  Object bean = resolveBeforeInstantiation(beanName, mbdToUse);
  if (bean != null) {
    return bean;
  }
}
// ...
try {
    Object beanInstance = doCreateBean(beanName, mbdToUse, args);
    if (logger.isDebugEnabled()) {
        logger.debug("Finished creating instance of bean '" + beanName + "'");
    }
    return beanInstance;
}
// ...
```

## doCreateBean

```java
// AbstractAutowireCapableBeanFactory.java#doCreateBean(xxx)

// ...
// 创建Bean实例
if (instanceWrapper == null) {
  instanceWrapper = createBeanInstance(beanName, mbd, args);
}
//...

// Allow post-processors to modify the merged bean definition.
// 初始化前调用 post-processors，可以让我们在 bean 实例化之前做一些定制操作
synchronized (mbd.postProcessingLock) {
  if (!mbd.postProcessed) {
    try {
      // 使用 MergedBeanDefinitionPostProcessor，Autowired 注解就是通过此方法实现类型的预解析
      applyMergedBeanDefinitionPostProcessors(mbd, beanType, beanName);
    }
    catch (Throwable ex) {
      throw new BeanCreationException(mbd.getResourceDescription(), beanName,
          "Post-processing of merged bean definition failed", ex);
    }
    mbd.postProcessed = true;
  }
}

// Eagerly cache singletons to be able to resolve circular references
// even when triggered by lifecycle interfaces like BeanFactoryAware.
// 解决循环依赖问题(只解决单例Bean)
boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences &&
    isSingletonCurrentlyInCreation(beanName));
if (earlySingletonExposure) {
  if (logger.isTraceEnabled()) {
    logger.trace("Eagerly caching bean '" + beanName +
        "' to allow for resolving potential circular references");
  }
  addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
}

Object exposedObject = bean;
try {
  // 填充属性
  populateBean(beanName, mbd, instanceWrapper);
  // 初始化 bean 对象
  exposedObject = initializeBean(beanName, exposedObject, mbd);
}

// ...

```

## initializeBean

```java
// AbstractAutowireCapableBeanFactory.java#initializeBean(xxx)

//... 

// 注入 aware，比如 BeanNameAware，BeanClassLoaderAware，BeanFactoryAware
invokeAwareMethods(beanName, bean);

// 调用 BeanPostProcessor 的 postProcessBeforeInitialization 方法
Object wrappedBean = bean;
if (mbd == null || !mbd.isSynthetic()) {
  wrappedBean = applyBeanPostProcessorsBeforeInitialization(wrappedBean, beanName);
}

//...

// 调用 bean 的 初始化方法
// 如果是 InitializingBean，会先调用 afterPropertiesSet() 方法
// 如果有 自定义的 init 方法，会再次调用自定义的 init 方法
invokeInitMethods(beanName, wrappedBean, mbd);

// 调用 BeanPostProcessor 的 postProcessAfterInitialization 方法
if (mbd == null || !mbd.isSynthetic()) {
  wrappedBean = applyBeanPostProcessorsAfterInitialization(wrappedBean, beanName);
}

return wrappedBean;
```

bean 大致的加载流程就是这样，上面的一些方法比如 createBeanInstance(), populateBean() 等代码都没有贴出来，可以去阅读源码查看。

------

附一张 bean 的生命周期图

![](https://user-images.githubusercontent.com/8939151/60397432-d0569d80-9b7f-11e9-89b0-79a045f1ffd7.png)


