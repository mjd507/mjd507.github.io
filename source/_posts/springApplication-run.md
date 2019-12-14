---
title: Spring 启动流程
categories: Spring
toc: true
comments: true
copyright: true
visible: true
date: 2019-06-22 14:41:43
tags:
---

简单跑下 `new SpringApplication().run(args)` 做了哪些事情。 

<!--more-->

## new SpringApplication()

创建 SpringApplication，做了四件事:

1. 根据 classpath 推断出 application 的类型，一般为 servlet-based web application
2. setInitializers(...), 设置 ApplicationContext 的初始化操作器
3. setListeners(...), 设置应用的监听器
4. 推断 application 的类

2、3 的 Initializers，Listeners 都是在 spring.factories 中配置文件中预先配置好，通过**工厂模式 + 配置文件**来实现解耦。

```java 
  public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {
    // ...
    this.webApplicationType = WebApplicationType.deduceFromClasspath();
    setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class));
    setListeners((Collection) getSpringFactoriesInstances(ApplicationListener.class));
    this.mainApplicationClass = deduceMainApplicationClass();
    // ...
  }
```
spring.factories
```yml
# Application Context Initializers
org.springframework.context.ApplicationContextInitializer=\
org.springframework.boot.context.ConfigurationWarningsApplicationContextInitializer,\
org.springframework.boot.context.ContextIdApplicationContextInitializer,\
org.springframework.boot.context.config.DelegatingApplicationContextInitializer,\
org.springframework.boot.web.context.ServerPortInfoApplicationContextInitializer

# Application Listeners
org.springframework.context.ApplicationListener=\
org.springframework.boot.ClearCachesApplicationListener,\
org.springframework.boot.builder.ParentContextCloserApplicationListener,\
org.springframework.boot.context.FileEncodingApplicationListener,\
org.springframework.boot.context.config.AnsiOutputApplicationListener,\
org.springframework.boot.context.config.ConfigFileApplicationListener,\
org.springframework.boot.context.config.DelegatingApplicationListener,\
org.springframework.boot.context.logging.ClasspathLoggingApplicationListener,\
org.springframework.boot.context.logging.LoggingApplicationListener,\
org.springframework.boot.liquibase.LiquibaseServiceLocatorApplicationListener
```

## run(args)

### getRunListeners

```java
  // 获取 SpringApplicationRunListener，对应配置文件的 EventPublishingRunListener
  // 这里实际上是一个 spring 的一个事件发布器，里面维护了一个简单的事件多播器 SimpleApplicationEventMulticaster
  // 这个多播器，加载了所有的监听器，可以看成一个事件总线，用来发布事件 以及 处理事件。
  SpringApplicationRunListeners listeners = getRunListeners(args); 

  // 发布事件: ApplicationStartingEvent 
  // 有两个监听器监听了该事件
  //    LoggingApplicationListener （日志系统的预初始化）
  //    LiquibaseServiceLocatorApplicationListener （暂无使用）
  listeners.starting();
```

```yml
# Run Listeners
org.springframework.boot.SpringApplicationRunListener=\
org.springframework.boot.context.event.EventPublishingRunListener
```


### prepareEnvironment

```java
  ApplicationArguments applicationArguments = new DefaultApplicationArguments(args);
  // 1. 首先会创建一个 StandardServletEnvironment.
  // 2. 配置 PropertySources，包含命令行传入进来的属性参数
  // 3. 配置被 active 的 profile，或者默认激活的 default
  // 4. 发布环境准备完毕事件
  // 5. 将该环境 bind 到 spring application 上
  ConfigurableEnvironment environment = prepareEnvironment(listeners, applicationArguments);
  // 设置 系统属性 spring.beaninfo.ignore 为 true
  configureIgnoreBeanInfo(environment);
  // 打印 banner
  Banner printedBanner = printBanner(environment);
```

### createApplicationContext

```java
// 基于 application 类型，创建容器。一般为 AnnotationConfigServletWebServerApplicationContext
// 实例化容器时，做了这么几件事
// 1. 创建了默认的 beanFactory. -> DefaultListableBeanFactory
//      -- 用来存储 bean definitions 和 post-processors
// 2. 创建 AnnotatedBeanDefinitionReader. 用来读取含有注解的 bean.
//      -- 注册了常用注解的 processors，比如: @Autowired，@Required，@Resource 等.
//      -- 这些内部的 processors 通常以 internal 开头
// 3. 创建 ClassPathBeanDefinitionScanner. 用来扫描 classpath 上的 bean. 
//      -- 默认的通过 @Component，@Repository，@Service，@Controller 来过滤。
//      -- 可指定 packages.
// 
// 2 和 3 预加载的 bean definitions 和 post-processors 会在接下来发挥作用。
context = createApplicationContext();
```

### prepareContext

```java
// 准备容器
//  1. 设置容器的 environment 为之前准备好的 environment
//  2. apply 容器的 processors，
//      -- 比如 管理内部 bean name 的 BeanNameGenerator; 
//      -- 加载资源的 resourceLoader; 
//      -- 转换和格式化资源的 ApplicationConversionService
//  3. apply Initializers. 这些初始化器即第一步在 new SpringApplication() 时就设置好了
//      -- SharedMetadataReaderFactoryContextInitializer -> add CachingMetadataReaderFactoryPostProcessor
//      -- ContextIdApplicationContextInitializer -> registerSingleton(ContextId)
//      -- RestartScopeInitializer -> registerScope(RestartScopeInitializer.RestartScope)
//      -- ConfigurationWarningsApplicationContextInitializer -> add ConfigurationWarningsPostProcessor
//      -- ServerPortInfoApplicationContextInitializer -> addApplicationListener(this);
//      -- ConditionEvaluationReportLoggingListener  addApplicationListener(ConditionEvaluationReportListener);
//  4. 发布 contextPrepared event ——> ApplicationContextInitializedEvent
//  5. Load the sources, 将 application 注册到 bean factory 中
//  6. 发布 contextLoaded event ——> ApplicationPreparedEvent
prepareContext(context, environment, listeners, applicationArguments, printedBanner);
```

### refreshContext

```java
// 刷新容器 在 AbstractApplicationContext 中
// 步骤非常多，总共十三步，简单整理，下一篇详细整理这块
// 1. 容器刷新准备 -> 设置开始时间，激活标记，和属性的初始化。
// 2. 拿到 bean factory
// 3. 配置 bean factory. 比如 classloader 和 post-processors
// 4. 给 context 的子类处理 bean factory 
// 5. 调用 BeanFactoryPostProcessor 来加载所有的 bean 到一个 map 中
// 6. 注册 BeanPostProcessor 用来拦截 bean 的创建
// 7. 为 BeanFactory 注册 MessageSource
// 8. 为 BeanFactory 注册 ApplicationEventMulticaster
// 9. 给 content 的特定子类执行 onRefresh，初始化其他特殊bean. 这里创建了一个 TomcatWebServer
// 10.注册 含有 application listener 的 bean
// 11.实例化所有的 bean (non-lazy singleton beans)
// 12.刷新完毕，初始化生命周期的 processor 并调用其 onRefresh; 发布事件: ContextRefreshedEvent
// 13.清除 spring 反射相关的缓存
refreshContext(context);
```

### afterRefresh

```java
// 容器刷新之后，这里默认没有操作
afterRefresh(context, applicationArguments);
```

### listeners.started

```java
// 发布事件: ApplicationStartedEvent
listeners.started(context);
```

### callRunners

```java
// 启动所有 runner 方法
callRunners(context, applicationArguments);
```

### listeners.running

```java
// 发布事件: ApplicationReadyEvent
listeners.running(context);
```





