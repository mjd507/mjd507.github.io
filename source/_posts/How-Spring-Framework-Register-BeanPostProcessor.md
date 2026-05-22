---
title: How Spring Framework Register BeanPostProcessor
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2026-05-21 14:30:23
tags:
---

During Spring Project startup, with each additional 
BeanPostProcessor, all beans will go through methods
 `postProcessBeforeInitialization` &  `postProcessAfterInitialization`. 

so by default, these BeanPostProcessor are not registered by default. unless we explictly add annotation like `Enable*`, then respective BeanPostProcessor will be registered.

Let's see some examples.

<!--more-->

## `@EnableAsync`

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(AsyncConfigurationSelector.class)
public @interface EnableAsync {

  Class<? extends Annotation> annotation() default Annotation.class;

  boolean proxyTargetClass() default false;

  AdviceMode mode() default AdviceMode.PROXY;

  int order() default Ordered.LOWEST_PRECEDENCE;

}
```

`@EnableAsync` uses `ImportSelector` to select proxy configuration based on `mode`.

```java
public class AsyncConfigurationSelector extends AdviceModeImportSelector<EnableAsync> {

  private static final String ASYNC_EXECUTION_ASPECT_CONFIGURATION_CLASS_NAME =
      "org.springframework.scheduling.aspectj.AspectJAsyncConfiguration";

  @Override
  public String[] selectImports(AdviceMode adviceMode) {
    return switch (adviceMode) {
      case PROXY -> new String[] {ProxyAsyncConfiguration.class.getName()};
      case ASPECTJ -> new String[] {ASYNC_EXECUTION_ASPECT_CONFIGURATION_CLASS_NAME};
    };
  }

}


public abstract class AdviceModeImportSelector<A extends Annotation> implements ImportSelector {

  public static final String DEFAULT_ADVICE_MODE_ATTRIBUTE_NAME = "mode";


  protected String getAdviceModeAttributeName() {
    return DEFAULT_ADVICE_MODE_ATTRIBUTE_NAME;
  }

  @Override
  public final String[] selectImports(AnnotationMetadata importingClassMetadata) {
    Class<?> annType = GenericTypeResolver.resolveTypeArgument(getClass(), AdviceModeImportSelector.class);
    Assert.state(annType != null, "Unresolvable type argument for AdviceModeImportSelector");

    AnnotationAttributes attributes = AnnotationConfigUtils.attributesFor(importingClassMetadata, annType);
    if (attributes == null) {
      throw new IllegalArgumentException(String.format(
          "@%s is not present on importing class '%s' as expected",
          annType.getSimpleName(), importingClassMetadata.getClassName()));
    }

    AdviceMode adviceMode = attributes.getEnum(getAdviceModeAttributeName());
    String[] imports = selectImports(adviceMode);
    if (imports == null) {
      throw new IllegalArgumentException("Unknown AdviceMode: " + adviceMode);
    }
    return imports;
  }

  protected abstract String @Nullable [] selectImports(AdviceMode adviceMode);

}

```

By default, the `mode` is `PROXY`, which uses jdk/cglib proxy-based advice, which will load `AsyncAnnotationBeanPostProcessor`. 

any methods annoatated with `@Async` will be enhanced by this processor.

```java
@Configuration(proxyBeanMethods = false)
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
public class ProxyAsyncConfiguration extends AbstractAsyncConfiguration {

  @Bean(name = TaskManagementConfigUtils.ASYNC_ANNOTATION_PROCESSOR_BEAN_NAME)
  @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
  public AsyncAnnotationBeanPostProcessor asyncAdvisor() {
    Assert.state(this.enableAsync != null, "@EnableAsync annotation metadata was not injected");
    AsyncAnnotationBeanPostProcessor bpp = new AsyncAnnotationBeanPostProcessor();
    bpp.configure(this.executor, this.exceptionHandler);
    Class<? extends Annotation> customAsyncAnnotation = this.enableAsync.getClass("annotation");
    if (customAsyncAnnotation != AnnotationUtils.getDefaultValue(EnableAsync.class, "annotation")) {
      bpp.setAsyncAnnotationType(customAsyncAnnotation);
    }
    if (this.enableAsync.getBoolean("proxyTargetClass")) {
      bpp.setProxyTargetClass(true);
    }
    bpp.setOrder(this.enableAsync.<Integer>getNumber("order"));
    return bpp;
  }

}

```

`ASPECTJ` is another option for the `mode`, which uses AspectJ weaving-based advice. a runtime advice.

```java
@Configuration(proxyBeanMethods = false)
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
public class AspectJAsyncConfiguration extends AbstractAsyncConfiguration {

  @Bean(name = TaskManagementConfigUtils.ASYNC_EXECUTION_ASPECT_BEAN_NAME)
  @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
  public AnnotationAsyncExecutionAspect asyncAdvisor() {
    AnnotationAsyncExecutionAspect asyncAspect = AnnotationAsyncExecutionAspect.aspectOf();
    asyncAspect.configure(this.executor, this.exceptionHandler);
    return asyncAspect;
  }

}
```


## `@EnableResilientMethods`

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(ResilientMethodsConfiguration.class)
public @interface EnableResilientMethods {

  boolean proxyTargetClass() default false;

  int order() default Ordered.LOWEST_PRECEDENCE - 1;

}
```

`@EnableResilientMethods` uses `ImportAware` to inject the annotation metadata of the Configuration class. 

it will register two beanPostProcessors, `RetryAnnotationBeanPostProcessor` and `ConcurrencyLimitBeanPostProcessor`.

```java
@Configuration(proxyBeanMethods = false)
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
public class ResilientMethodsConfiguration implements ImportAware {

  private @Nullable AnnotationAttributes enableResilientMethods;


  @Override
  public void setImportMetadata(AnnotationMetadata importMetadata) {
    this.enableResilientMethods = AnnotationAttributes.fromMap(
        importMetadata.getAnnotationAttributes(EnableResilientMethods.class.getName()));
  }

  private void configureProxySupport(ProxyProcessorSupport proxySupport) {
    if (this.enableResilientMethods != null) {
      if (this.enableResilientMethods.getBoolean("proxyTargetClass")) {
        proxySupport.setProxyTargetClass(true);
      }
      proxySupport.setOrder(this.enableResilientMethods.getNumber("order"));
    }
  }


  @Bean(name = "org.springframework.resilience.annotation.internalRetryAnnotationProcessor")
  @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
  public RetryAnnotationBeanPostProcessor retryAdvisor() {
    RetryAnnotationBeanPostProcessor bpp = new RetryAnnotationBeanPostProcessor();
    configureProxySupport(bpp);
    return bpp;
  }

  @Bean(name = "org.springframework.resilience.annotation.internalConcurrencyLimitProcessor")
  @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
  public ConcurrencyLimitBeanPostProcessor concurrencyLimitAdvisor() {
    ConcurrencyLimitBeanPostProcessor bpp = new ConcurrencyLimitBeanPostProcessor();
    configureProxySupport(bpp);
    return bpp;
  }

}
```

the `RetryAnnotationBeanPostProcessor` will enhance methods which are annotated with `@Retryable`.
the `ConcurrencyLimitBeanPostProcessor` will enhance methods which are annotated with `@ConcurrencyLimit`.

------

Note: the order really matters, `@EnableAsync` defined with `Order.LOWEST_PRECEDENCE`, where `@EnableResilientMethods` defined with `Order.LOWEST_PRECEDENCE - 1`.

So, if a method annotated with both `@Async` and `@Retryable`, it will be adviced by the `RetryAnnotationBeanPostProcessor` first. 

from the real execution side, the method will be executed in a async thread first, then if failed, retry happened.


## `@EnableTransactionManagement`

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(TransactionManagementConfigurationSelector.class)
public @interface EnableTransactionManagement {

  boolean proxyTargetClass() default false;

  int order() default Ordered.LOWEST_PRECEDENCE;

  RollbackOn rollbackOn() default RollbackOn.RUNTIME_EXCEPTIONS;

}
```

```java
public class TransactionManagementConfigurationSelector extends AdviceModeImportSelector<EnableTransactionManagement> {

  @Override
  protected String[] selectImports(AdviceMode adviceMode) {
    return switch (adviceMode) {
      case PROXY -> new String[] {AutoProxyRegistrar.class.getName(),
          ProxyTransactionManagementConfiguration.class.getName()};
      case ASPECTJ -> new String[] {determineTransactionAspectClass()};
    };
  }

  private String determineTransactionAspectClass() {
    return (ClassUtils.isPresent("jakarta.transaction.Transactional", getClass().getClassLoader()) ?
        TransactionManagementConfigUtils.JTA_TRANSACTION_ASPECT_CONFIGURATION_CLASS_NAME :
        TransactionManagementConfigUtils.TRANSACTION_ASPECT_CONFIGURATION_CLASS_NAME);
  }

}

```

based on the `mode` to select the advice type, either jdk/cglib proxy or AspectJ, any methods annotated with `@Transactional` with be adviced by the choose in the configuation.


## `@EnableCaching`

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(CachingConfigurationSelector.class)
public @interface EnableCaching {

  boolean proxyTargetClass() default false;

  AdviceMode mode() default AdviceMode.PROXY;

  int order() default Ordered.LOWEST_PRECEDENCE;

}

```

similar to above advice based selector.


## `@EnableScheduling`

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(SchedulingConfiguration.class)
@Documented
public @interface EnableScheduling {

}
```

```java
@Configuration(proxyBeanMethods = false)
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
public class SchedulingConfiguration {

  @Bean(name = TaskManagementConfigUtils.SCHEDULED_ANNOTATION_PROCESSOR_BEAN_NAME)
  @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
  public ScheduledAnnotationBeanPostProcessor scheduledAnnotationProcessor() {
    return new ScheduledAnnotationBeanPostProcessor();
  }

}
```

`ScheduledAnnotationBeanPostProcessor` will register any methods with `@Scheduled` annotation to be inboked by a TaskScheduler according to the `fixedRate`, `fixedDelay` or `cron` provided via the annotation.




