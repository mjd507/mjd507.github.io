---
title: Spring Retry
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2025-06-27 20:46:07
tags:
---

in Spring-Framework 7.0, Spring team redesigned a minimal core retry feature in `spring-core`. inspired by the [Spring Retry](https://github.com/spring-projects/spring-retry) project.

currently only with 3 classes & 4 interfaces.

let's deep into it.

Referneces: 

[Introduce minimal retry functionality as a core framework feature](https://github.com/spring-projects/spring-framework/pull/34716)

[Introduce @Retryable AOP support (based on core.retry and Reactor retry functionality)](https://github.com/spring-projects/spring-framework/issues/34529)

<!--more-->

## Retryable

`Retryable` is a functional interface that can be used to implement any generic block of code that can potentially be retried.

```java
@FunctionalInterface
public interface Retryable<R> {

	@Nullable R execute() throws Throwable;

	default String getName() {
		return getClass().getName();
	}
}

```

## RetryListener

`RetryListener` defines a listener API for reacting to events published during the execution of a `Retryable` operation.

```java
public interface RetryListener {

	default void beforeRetry(RetryPolicy retryPolicy, Retryable<?> retryable) {
	}

	default void onRetrySuccess(RetryPolicy retryPolicy, Retryable<?> retryable, @Nullable Object result) {
	}

	default void onRetryFailure(RetryPolicy retryPolicy, Retryable<?> retryable, Throwable throwable) {
	}

	default void onRetryPolicyExhaustion(RetryPolicy retryPolicy, Retryable<?> retryable, Throwable throwable) {
	}

}
```

## CompositeRetryListener

A composite implementation of the `RetryListener` interface. Delegate listeners will be called in their registration order.

```java
public class CompositeRetryListener implements RetryListener {

	private final List<RetryListener> listeners = new LinkedList<>();

	public CompositeRetryListener() {
	}

	public CompositeRetryListener(List<RetryListener> listeners) {
		Assert.notEmpty(listeners, "RetryListener List must not be empty");
		this.listeners.addAll(listeners);
	}

	public void addListener(RetryListener listener) {
		this.listeners.add(listener);
	}

	@Override
	public void beforeRetry(RetryPolicy retryPolicy, Retryable<?> retryable) {
		this.listeners.forEach(retryListener -> retryListener.beforeRetry(retryPolicy, retryable));
	}

	@Override
	public void onRetrySuccess(RetryPolicy retryPolicy, Retryable<?> retryable, @Nullable Object result) {
		this.listeners.forEach(listener -> listener.onRetrySuccess(retryPolicy, retryable, result));
	}

	@Override
	public void onRetryFailure(RetryPolicy retryPolicy, Retryable<?> retryable, Throwable throwable) {
		this.listeners.forEach(listener -> listener.onRetryFailure(retryPolicy, retryable, throwable));
	}

	@Override
	public void onRetryPolicyExhaustion(RetryPolicy retryPolicy, Retryable<?> retryable, Throwable throwable) {
		this.listeners.forEach(listener -> listener.onRetryPolicyExhaustion(retryPolicy, retryable, throwable));
	}

}
```

## RetryOperations

Interface specifying basic retry operations.

```java
public interface RetryOperations {

	<R> @Nullable R execute(Retryable<? extends @Nullable R> retryable) throws RetryException;

}
```

## RetryPolicy

Strategy interface to define a retry policy.
Also provides factory methods and a fluent builder API for creating retry policies with common configurations.

```java
public interface RetryPolicy {

	boolean shouldRetry(Throwable throwable);

	default BackOff getBackOff() {
		return new FixedBackOff(Builder.DEFAULT_DELAY, Builder.DEFAULT_MAX_ATTEMPTS);
	}

	static RetryPolicy withDefaults() {
		return throwable -> true;
	}

	static RetryPolicy withMaxAttempts(long maxAttempts) {
		Assert.isTrue(maxAttempts > 0, "Max attempts must be greater than zero");
		return builder().backOff(new FixedBackOff(Builder.DEFAULT_DELAY, maxAttempts)).build();
	}

	static RetryPolicy withMaxElapsedTime(Duration maxElapsedTime) {
		return builder().maxElapsedTime(maxElapsedTime).build();
	}

	static Builder builder() {
		return new Builder();
	}


	final class Builder {

		public static final long DEFAULT_MAX_ATTEMPTS = 3;

		public static final long DEFAULT_DELAY = 1000;

		public static final long DEFAULT_MAX_DELAY = Long.MAX_VALUE;

		public static final double DEFAULT_MULTIPLIER = 1.0;


		private @Nullable BackOff backOff;

		private long maxAttempts;

		private @Nullable Duration delay;

		private @Nullable Duration jitter;

		private double multiplier;

		private @Nullable Duration maxDelay;

		private @Nullable Duration maxElapsedTime;

		private final Set<Class<? extends Throwable>> includes = new LinkedHashSet<>();

		private final Set<Class<? extends Throwable>> excludes = new LinkedHashSet<>();

		private @Nullable Predicate<Throwable> predicate;


		private Builder() {
			// internal constructor
		}

		public Builder backOff(BackOff backOff) {
			Assert.notNull(backOff, "BackOff must not be null");
			this.backOff = backOff;
			return this;
		}

		public Builder maxAttempts(long maxAttempts) {
			Assert.isTrue(maxAttempts > 0, "Max attempts must be greater than zero");
			this.maxAttempts = maxAttempts;
			return this;
		}

		public Builder delay(Duration delay) {
			assertIsPositive("delay", delay);
			this.delay = delay;
			return this;
		}

		public Builder jitter(Duration jitter) {
			Assert.isTrue(!jitter.isNegative(),
					() -> "Invalid jitter (%dms): must be >= 0.".formatted(jitter.toMillis()));
			this.jitter = jitter;
			return this;
		}

		public Builder multiplier(double multiplier) {
			Assert.isTrue(multiplier >= 1, () -> "Invalid multiplier '" + multiplier + "': " +
					"must be greater than or equal to 1. A multiplier of 1 is equivalent to a fixed delay.");
			this.multiplier = multiplier;
			return this;
		}

		public Builder maxDelay(Duration maxDelay) {
			assertIsPositive("maxDelay", maxDelay);
			this.maxDelay = maxDelay;
			return this;
		}

		public Builder maxElapsedTime(Duration maxElapsedTime) {
			assertIsPositive("maxElapsedTime", maxElapsedTime);
			this.maxElapsedTime = maxElapsedTime;
			return this;
		}

		@SafeVarargs // Making the method final allows us to use @SafeVarargs.
		@SuppressWarnings("varargs")
		public final Builder includes(Class<? extends Throwable>... types) {
			Collections.addAll(this.includes, types);
			return this;
		}

		public Builder includes(Collection<Class<? extends Throwable>> types) {
			this.includes.addAll(types);
			return this;
		}

		@SafeVarargs // Making the method final allows us to use @SafeVarargs.
		@SuppressWarnings("varargs")
		public final Builder excludes(Class<? extends Throwable>... types) {
			Collections.addAll(this.excludes, types);
			return this;
		}

		public Builder excludes(Collection<Class<? extends Throwable>> types) {
			this.excludes.addAll(types);
			return this;
		}

		public Builder predicate(Predicate<Throwable> predicate) {
			this.predicate = (this.predicate != null ? this.predicate.and(predicate) : predicate);
			return this;
		}

		public RetryPolicy build() {
			BackOff backOff = this.backOff;
			if (backOff != null) {
				boolean misconfigured = (this.maxAttempts != 0) || (this.delay != null) || (this.jitter != null) ||
						(this.multiplier != 0) || (this.maxDelay != null) || (this.maxElapsedTime != null);
				Assert.state(!misconfigured, """
						The following configuration options are not supported with a custom BackOff strategy: \
						maxAttempts, delay, jitter, multiplier, maxDelay, or maxElapsedTime.""");
			}
			else {
				ExponentialBackOff exponentialBackOff = new ExponentialBackOff();
				exponentialBackOff.setMaxAttempts(this.maxAttempts > 0 ? this.maxAttempts : DEFAULT_MAX_ATTEMPTS);
				exponentialBackOff.setInitialInterval(this.delay != null ? this.delay.toMillis() : DEFAULT_DELAY);
				exponentialBackOff.setMaxInterval(this.maxDelay != null ? this.maxDelay.toMillis() : DEFAULT_MAX_DELAY);
				exponentialBackOff.setMultiplier(this.multiplier > 1 ? this.multiplier : DEFAULT_MULTIPLIER);
				if (this.jitter != null) {
					exponentialBackOff.setJitter(this.jitter.toMillis());
				}
				if (this.maxElapsedTime != null) {
					exponentialBackOff.setMaxElapsedTime(this.maxElapsedTime.toMillis());
				}
				backOff = exponentialBackOff;
			}
			return new DefaultRetryPolicy(this.includes, this.excludes, this.predicate, backOff);
		}

		private static void assertIsPositive(String name, Duration duration) {
			Assert.isTrue((!duration.isNegative() && !duration.isZero()),
					() -> "Invalid duration (%dms): %s must be positive.".formatted(duration.toMillis(), name));
		}
	}

}
```

## DefaultRetryPolicy

Default `RetryPolicy` created by `RetryPolicy.Builder`.

```java
class DefaultRetryPolicy implements RetryPolicy {

	private final Set<Class<? extends Throwable>> includes;

	private final Set<Class<? extends Throwable>> excludes;

	private final @Nullable Predicate<Throwable> predicate;

	private final BackOff backOff;


	DefaultRetryPolicy(Set<Class<? extends Throwable>> includes, Set<Class<? extends Throwable>> excludes,
			@Nullable Predicate<Throwable> predicate, BackOff backOff) {

		this.includes = includes;
		this.excludes = excludes;
		this.predicate = predicate;
		this.backOff = backOff;
	}


	@Override
	public boolean shouldRetry(Throwable throwable) {
		if (!this.excludes.isEmpty()) {
			for (Class<? extends Throwable> excludedType : this.excludes) {
				if (excludedType.isInstance(throwable)) {
					return false;
				}
			}
		}
		if (!this.includes.isEmpty()) {
			boolean included = false;
			for (Class<? extends Throwable> includedType : this.includes) {
				if (includedType.isInstance(throwable)) {
					included = true;
					break;
				}
			}
			if (!included) {
				return false;
			}
		}
		return this.predicate == null || this.predicate.test(throwable);
	}

	@Override
	public BackOff getBackOff() {
		return this.backOff;
	}

	@Override
	public String toString() {
		StringJoiner result = new StringJoiner(", ", "DefaultRetryPolicy[", "]");
		if (!this.includes.isEmpty()) {
			result.add("includes=" + names(this.includes));
		}
		if (!this.excludes.isEmpty()) {
			result.add("excludes=" + names(this.excludes));
		}
		if (this.predicate != null) {
			result.add("predicate=" + this.predicate.getClass().getSimpleName());
		}
		result.add("backOff=" + this.backOff);
		return result.toString();
	}


	private static String names(Set<Class<? extends Throwable>> types) {
		StringJoiner result = new StringJoiner(", ", "[", "]");
		for (Class<? extends Throwable> type : types) {
			String name = type.getCanonicalName();
			result.add(name != null? name : type.getName());
		}
		return result.toString();
	}

```

## RetryTemplate

A basic implementation of `RetryOperations` that executes and potentially retries a Retryable operation based on a configured `RetryPolicy`.
By default, a retryable operation will be retried at most 3 times with a fixed backoff of 1 second.

```java
public class RetryTemplate implements RetryOperations {

	private static final LogAccessor logger = new LogAccessor(RetryTemplate.class);

	private RetryPolicy retryPolicy = RetryPolicy.withDefaults();

	private RetryListener retryListener = new RetryListener() {};


	public RetryTemplate() {
	}

	public RetryTemplate(RetryPolicy retryPolicy) {
		Assert.notNull(retryPolicy, "RetryPolicy must not be null");
		this.retryPolicy = retryPolicy;
	}


	public void setRetryPolicy(RetryPolicy retryPolicy) {
		Assert.notNull(retryPolicy, "Retry policy must not be null");
		this.retryPolicy = retryPolicy;
	}

	public void setRetryListener(RetryListener retryListener) {
		Assert.notNull(retryListener, "Retry listener must not be null");
		this.retryListener = retryListener;
	}


	@Override
	public <R> @Nullable R execute(Retryable<? extends @Nullable R> retryable) throws RetryException {
		String retryableName = retryable.getName();
		// Initial attempt
		try {
			logger.debug(() -> "Preparing to execute retryable operation '%s'".formatted(retryableName));
			R result = retryable.execute();
			logger.debug(() -> "Retryable operation '%s' completed successfully".formatted(retryableName));
			return result;
		}
		catch (Throwable initialException) {
			logger.debug(initialException,
					() -> "Execution of retryable operation '%s' failed; initiating the retry process"
							.formatted(retryableName));
			// Retry process starts here
			BackOffExecution backOffExecution = this.retryPolicy.getBackOff().start();
			Deque<Throwable> exceptions = new ArrayDeque<>();
			exceptions.add(initialException);

			Throwable retryException = initialException;
			while (this.retryPolicy.shouldRetry(retryException)) {
				try {
					long duration = backOffExecution.nextBackOff();
					if (duration == BackOffExecution.STOP) {
						break;
					}
					logger.debug(() -> "Backing off for %dms after retryable operation '%s'"
							.formatted(duration, retryableName));
					Thread.sleep(duration);
				}
				catch (InterruptedException interruptedException) {
					Thread.currentThread().interrupt();
					throw new RetryException(
							"Unable to back off for retryable operation '%s'".formatted(retryableName),
							interruptedException);
				}
				logger.debug(() -> "Preparing to retry operation '%s'".formatted(retryableName));
				try {
					this.retryListener.beforeRetry(this.retryPolicy, retryable);
					R result = retryable.execute();
					this.retryListener.onRetrySuccess(this.retryPolicy, retryable, result);
					logger.debug(() -> "Retryable operation '%s' completed successfully after retry"
							.formatted(retryableName));
					return result;
				}
				catch (Throwable currentAttemptException) {
					logger.debug(() -> "Retry attempt for operation '%s' failed due to '%s'"
							.formatted(retryableName, currentAttemptException));
					this.retryListener.onRetryFailure(this.retryPolicy, retryable, currentAttemptException);
					exceptions.add(currentAttemptException);
					retryException = currentAttemptException;
				}
			}

			RetryException finalException = new RetryException(
					"Retry policy for operation '%s' exhausted; aborting execution".formatted(retryableName),
					exceptions.removeLast());
			exceptions.forEach(finalException::addSuppressed);
			this.retryListener.onRetryPolicyExhaustion(this.retryPolicy, retryable, finalException);
			throw finalException;
		}
	}

}
```

End.