---
title: Transactional Outbox Pattern
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2024-07-06 11:09:31
tags:
---

[Transactional Outbox pattern with Spring Boot](https://www.wimdeblauwe.com/blog/2024/06/25/transactional-outbox-pattern-with-spring-boot/)

[Pattern: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)

<!--more-->

## Background

suppose in a transaction, we have following actions: 
db operation 1 -- sending message -- db operation 2

issues here is:
- if db operation 2 failed, the transaction data will roll back, but the message is sent.

one solution here is:  
- db operation 1/2/.. -- sending message 

we put the sending message in the last step, within the transaction.

most of us may do in this way, it's simple and reliable. only concern is it could be a long transaction as we interacting with exteral system. 

do we have other ways?
- here comes transaction outbox pattern.

## Definition

The Transactional Outbox is a way to ensure that 2 systems are in sync without having to use a distributed transaction between those systems. 

with this pattern, we can first store the fact (send email/message...) that should do some external action in database. Then, an asynchronous process can look at the database to know what still needs to happen, and can do that whenever there is time. If the external system is not available, the task can be retried later until it succeeds.

## Implementation

option 1:  Spring Integration. 

put the msg to a jdbc-backed output with a polling handler.

```java
@Bean
JdbcChannelMessageStore jdbcChannelMessageStore(DataSource dataSource) {
    JdbcChannelMessageStore jdbcChannelMessageStore = new JdbcChannelMessageStore(dataSource);
    jdbcChannelMessageStore.setTablePrefix("_spring_integration_");
    jdbcChannelMessageStore.setChannelMessageStoreQueryProvider(new PostgresChannelMessageStoreQueryProvider());
    return jdbcChannelMessageStore;
}

@Bean
public IntegrationFlow consumerFlow(JdbcChannelMessageStore jdbcChannelMessageStore,
    ConsumerService consumerService) {
return IntegrationFlow.from(msgInputDirectChannel())
    .channel(msgOutboxQueueChannel(jdbcChannelMessageStore))
    .handle(message -> {
        consumerService.consume(message.getPayload());
    }, e -> e.poller(Pollers.fixedDelay(Duration.ofSeconds(1)).transactional()))
    .get();
}
```

option 2: Spring Modulith

Communication between modules can be done asynchronously by using the ApplicationEventPublisher from Spring core.

Spring Modulith has additional infrastructure to ensure no such event is ever lost by first storing it in the database. We can leverage this to build our outbox pattern.

```java
// first transaction, ensure event are stored in db.
@Transactional
void register(User user) {
    User registeredUser = userRepository.save(user);
    applicationEventPublisher.publishEvent(new UserRegisteredEvent(registeredUser.getId()));
}

// second async thread transaction, ensure msg are deliverd to external system.
@ApplicationModuleListener
void onUserRegistered(UserRegisteredEvent userRegisteredEvent) {
    log.info("user registered. id:{}", userRegisteredEvent.id());
    // send email/message, etc.
}
```



