---
title: Jpa-Hibernate-Performance
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2024-03-17 09:46:17
tags:
---

[Performance oriented Spring Data JPA & Hibernate by Maciej Walkowiak](https://www.youtube.com/watch?v=exqfB1WaqIw)

[The Open Session In View Anti-Pattern](https://vladmihalcea.com/the-open-session-in-view-anti-pattern/)

[A Guide to Spring’s Open Session in View](https://www.baeldung.com/spring-open-session-in-view)

<!--more-->


## Why so slow

- Pool **database connection** management
- Too many queries
- Slow queries
- Wrong JPA mappings
- Fetching more than needed


## Connection Management

- each connection sparks a new OS process
- Consumes 5-10MB of RAM
- CPU context switching


No Connection Pool Flow:

    Application -> DataSource -> JDBC Driver -> Database 

    3ms to execute query, 100ms to establish connection.

Connection Pooling Flow:

     Application -> DataSource -> Connection Pool
     
- on application startup, creates a pool of physical connections
- Resues already open connections
- Creates more connections, when pool is exhausted

   

How Big is the pool:

- Tomcat handles requests with [200 threads](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html#application-properties.server.server.tomcat.threads.max) 
- HikariCP default pool size is [10](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html#application-properties.data.spring.datasource.hikari)


## Connection Metrics Tools

[Flexy Pool](https://github.com/vladmihalcea/flexy-pool)

[spring-boot-data-source-decorator](https://github.com/gavlyukovskiy/spring-boot-data-source-decorator)

When is connection acquired?

When is connection released?


## Demo 1,  spring-in-view

open-in-view will occupy the connection through each request session.

even the transactional method ends, it won't released until request ends.

spring.jpa.open-in-view = false , disable this will release the connection after Transactional ends.

```java
// Controller
@GetMapping("/hello")
public void hello() {
    sampleService.hello();
    externalService.call(); //200ms
}

// SampleService 
@Transactional
public void hello() {
    log.info("{}", personRepository.findAll());
}
```

following cases all disable the open-in-view.

## Demo 2, auto-commit

now by default connection is acquired when execute the transactional method. it's still not expected since the long external call doesn't need connection.

disable auto-commit to make the connection been acquired only when real query is occoured.

spring.datasource.hikari.auto-commit = false.

```java
// SampleService 
@Transactional
public void hello() {
    externalService.call(); //200ms
    log.info("{}", personRepository.findAll());
}

```

## Demo 3, transactionTemplate
in this case, even the auto-commit is false, connection will holds after the external call ends.

we can remove @Transactional, and use explict transaction template to control the connection acquired time.

```java
// SampleService 
@Transactional
public void hello() {
    log.info("{}", personRepository.findAll());
    externalService.call(); //200ms
}

```

```java
public void hello() {
    transactionTemplate.executeWithoutResult((transactionStatus)->{
        log.info("{}", personRepository.findAll());
    });
    externalService.call(); //200ms
}
```

## Demo 4, New Tranasction in Transaction

in this case, both two connections will be hold until method ends.

we can still use explict transaction template for first transaction.
```java
//  SampleService
@Transactional
public void hello() {
    log.info(personRepository.findAll());
    runInNewTransaction();
}
// AnotherService
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void runInNewTransaction() {
    log.info("{}", personRepository.findAll());
    Sleep.sleep(400);
}

```

```java
//  SampleService
public void hello() {
    transactionTemplate.executeWithoutResult((transactionStatus)->{
        log.info("{}", personRepository.findAll());
    });
    runInNewTransaction();
}
```

## Choose Wisely

> Whether the OSIV is a pattern or an anti-pattern is irrelevant. The most important thing here is the reality in which we’re living.
>
> If we’re developing a simple CRUD service, it might make sense to use the OSIV, as we may never encounter those performance issues.
>
> On the other hand, if we find ourselves calling a lot of remote services or there is so much going on outside of our transactional contexts, it’s highly recommended to disable the OSIV altogether. 
>
> When in doubt, start without OSIV, since we can easily enable it later. On the other hand, disabling an already enabled OSIV may be cumbersome, as we may need to handle a lot of LazyInitializationExceptions.
>
> The bottom line is that we should be aware of the trade-offs when using or ignoring the OSIV.