---
title: Resilience
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2025-09-02 19:01:13
tags:
---

my initial understanding of system resilience. 

good news is from the spring framework itself, we have these resilience capabilities.

> As of 7.0, the core Spring Framework includes a couple of common resilience features,
> in particular `@Retryable` and `@ConcurrencyLimit` annotations for method invocations.

another good resource is [resilience4j](https://github.com/resilience4j/resilience4j).

<!--more-->

## Circuit Breaker

A mechanism that stops calling a failing service after `threshold` failures, until `halfOpenAfter` milliseconds elapsed. A successful call resets the failure counter.

```java
int threshold = 5; // configurable
long halfOpenAfter = 5000; // configurable

AtomicInteger failureCount = new AtomicInteger();
volatile long lastFailureTime;

// just an example, in reality, aop with annotation is more often to use.
void callThirdParty() {
    if (failureCount.get() > this.threshold 
        && System.currentTimeMillis() - lastFailureTime < this.halfOpenAfter) {
        throw new CircuitBreakerOpenException("Circuit Breaker is open for method: callThirdParty()")
    }
    // call thrid party
    try {
        // call...
        // if success, reset the failure counter
        if (failureCount.get() > 0) {
            log.debug("Closing Circuit Breaker for method: callThirdParty()");
            failureCount.set(0);
            lastFailure = 0;
        }

    } catch(Exception e) {
        failureCount.incrementAndGet();
        lastFailure = System.currentTimeMillis();
        throw e;
    }
}
```

## Rate Limiter

A mechanism that protects its own service from being called by limiting the requests count.

```java

// borrow the case from [resilience4j](https://github.com/resilience4j/resilience4j)

private RateLimiter rateLimiter; // distribute permits at a configurable rate.

// again, just a sample, usually wrapped with aop.
void coreMethod() {
    boolean permission = rateLimiter.acquirePermission();
    if (!permission) {
        throw new RequestNotPermitted("RateLimiter does not permit further calls");
    }
    // method own logic...
}
```

an official example from resilience4j that shows how to restrict the calling rate of some method to be not higher than 1 request/second.

```java
// Create a custom RateLimiter configuration
RateLimiterConfig config = RateLimiterConfig.custom()
    .timeoutDuration(Duration.ofMillis(100))
    .limitRefreshPeriod(Duration.ofSeconds(1))
    .limitForPeriod(1)
    .build();
// Create a RateLimiter
RateLimiter rateLimiter = RateLimiter.of("backendName", config);

// Decorate your call to BackendService.doSomething()
Supplier<String> restrictedSupplier = RateLimiter
    .decorateSupplier(rateLimiter, backendService::doSomething);

// First call is successful
Try<String> firstTry = Try.ofSupplier(restrictedSupplier);
assertThat(firstTry.isSuccess()).isTrue();

// Second call fails, because the call was not permitted
Try<String> secondTry = Try.of(restrictedSupplier);
assertThat(secondTry.isFailure()).isTrue();
assertThat(secondTry.getCause()).isInstanceOf(RequestNotPermitted.class);
```

`@ConcurrencyLimit` in spring-framework is another kind of rate limiting.
```java
@ConcurrencyLimit(10)
public void sendNotification() {
    this.jmsClient.destination("notifications").send(...);
}
```


## Retry

many libraries provide retry function, I perfer the one in spring-framework.

```java
@Retryable(maxAttempts = 5, delay = 100, jitter = 10, multiplier = 2, maxDelay = 1000)
public void sendNotification() {
    this.jmsClient.destination("notifications").send(...);
}
```

see [Spring Core Retry](https://mjd507.github.io/2025/06/28/Spring-Retry/) and [BackOff](https://mjd507.github.io/2025/07/06/BackOff/)


## Cache

see abstraction: [spring-cache-abstraction](https://docs.spring.io/spring-framework/reference/integration/cache.html)

guave implementation: [guava-cache](https://github.com/google/guava/wiki/CachesExplained)

caffeine implementation: [caffeine](https://github.com/ben-manes/caffeine): A high performance caching library for Java

```java
LoadingCache<Key, Graph> graphs = Caffeine.newBuilder()
    .maximumSize(10_000)
    .expireAfterWrite(Duration.ofMinutes(5))
    .refreshAfterWrite(Duration.ofMinutes(1))
    .build(key -> createExpensiveGraph(key));
```


## Idempotent


End.