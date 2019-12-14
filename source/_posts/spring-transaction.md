---
title: Spring 的事务
categories: Spring
toc: true
comments: true
copyright: true
visible: true
date: 2019-07-14 11:23:22
tags:
---

概况起来，事务对应的是 connection. 默认一个事务一个连接，当然 spring 的事务传播机制提供了更多的选择。

<!--more-->

## 事务管理器

spring-tx 包下提供了事务管理的抽象，允许各个持久层框架来实现自己的 PlatformTransactionManager. 比如 DataSourceTransactionManager，JpaTransactionManager，HibernateTransactionManager 等

```java
public interface PlatformTransactionManager {

  // 获取事务（创建新事务/已存在的事务）
  // TransactionDefinition 主要定义了事务的 7 种传播属性，4 种隔离级别，事务的超时时间等。
  TransactionStatus getTransaction(TransactionDefinition definition) throws TransactionException;

  // 事务提交
  void commit(TransactionStatus status) throws TransactionException;

  // 事务回滚
  void rollback(TransactionStatus status) throws TransactionException;
}

```

事务就这三板斧，关于 7 中传播属性，网上有很多介绍，这里不再展开。

来测试下 spring-boot-starter-jdbc 提供的默认的 DataSource 以及 PlatformTransactionManager。

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class ApplicationTests {

  @Autowired
  private DataSource dataSource;
  @Autowired
  private PlatformTransactionManager platformTransactionManager;

  @Test
  public void defaultJDBC() {
    System.out.println(dataSource.getClass());
    System.out.println(platformTransactionManager.getClass());
  }

}

// 输出
// class com.zaxxer.hikari.HikariDataSource
// class org.springframework.jdbc.datasource.DataSourceTransactionManager

// 默认的 dataSouce 是 HikariDataSource，号称比传统的 C3P0、DBCP、Tomcat jdbc 等连接池更加优秀。
// 默认的 platformTransactionManager 为 DataSourceTransactionManager。
```

## 声明式事务

上一篇整理了 spring bean 的增强，其实声明式事务就是通过 aop 实现。 在方法上面添加 @Transactional 注解，并且在应用上添加 @EnableTransactionManagement。

通过 aop 创建带有事务拦截器(TransactionInterceptor)的代理对象
代理再通过事务拦截器配合对应的 platformTransactionManager，实现对事务方法的调用。

看下官方给的调用图。
![](https://docs.spring.io/spring/docs/5.1.x/spring-framework-reference/images/tx.png)

事务调用流程说明：
1. 调用 aop 代理对象
2. 调用事务的切面方法，开启一个 transaction
3. 调用自定义的切面的拦截方法（before/around）
4. 调用目标业务逻辑的方法 (方法调用结束)
5. 调用自定义的切面的拦截方法（after/around）
6. 调用事务的切面方法，commit 或 rollback 一个 transaction.
7. 返回到 aop 代理对象


