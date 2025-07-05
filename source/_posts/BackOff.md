---
title: BackOff
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2025-07-05 23:14:22
tags:
---

Backoff is a strategy for dealing with failures, conflicts, or resource competition.

The core logic is: when an operation fails or encounters a limitation, it will pause for a period of time before trying again, and the retry interval is usually adjusted dynamically to avoid increasing system pressure or conflicts.

let's see how spring-framework implement it.

<!--more-->

## BackOff

Strategy interface for providing a BackOffExecution that indicates the rate at which an operation should be retried.

```java
@FunctionalInterface
public interface BackOff {

	BackOffExecution start();

}
```

## BackOffExecution

An executable instance of a given BackOff strategy.

```java
@FunctionalInterface
public interface BackOffExecution {

	long STOP = -1;

	long nextBackOff();

}

```

## FixedBackOff

Provides a fixed interval between two attempts and a maximum number of retries.

```java
public class FixedBackOff implements BackOff {

	public static final long DEFAULT_INTERVAL = 5000;

	public static final long UNLIMITED_ATTEMPTS = Long.MAX_VALUE;

	private long interval = DEFAULT_INTERVAL;

	private long maxAttempts = UNLIMITED_ATTEMPTS;

        // ctors & getter & setter ...

	@Override
	public BackOffExecution start() {
		return new FixedBackOffExecution();
	}


	private class FixedBackOffExecution implements BackOffExecution {

		private long currentAttempts = 0;

		@Override
		public long nextBackOff() {
			this.currentAttempts++;
			if (this.currentAttempts <= getMaxAttempts()) {
				return getInterval();
			}
			else {
				return STOP;
			}
		}
	}
}

```

## ExponentialBackOff

Increases the back-off period for each attempt.

```java
public class ExponentialBackOff implements BackOff {

	public static final long DEFAULT_INITIAL_INTERVAL = 2000L;

	public static final long DEFAULT_JITTER = 0;

	public static final double DEFAULT_MULTIPLIER = 1.5;

	public static final long DEFAULT_MAX_INTERVAL = 30_000L;

	public static final long DEFAULT_MAX_ELAPSED_TIME = Long.MAX_VALUE;

	public static final long DEFAULT_MAX_ATTEMPTS = Long.MAX_VALUE;


	private long initialInterval = DEFAULT_INITIAL_INTERVAL;

	private long jitter = DEFAULT_JITTER;

	private double multiplier = DEFAULT_MULTIPLIER;

	private long maxInterval = DEFAULT_MAX_INTERVAL;

	private long maxElapsedTime = DEFAULT_MAX_ELAPSED_TIME;

	private long maxAttempts = DEFAULT_MAX_ATTEMPTS;

        // ctors & getter & setter ...

	@Override
	public BackOffExecution start() {
		return new ExponentialBackOffExecution();
	}


	private class ExponentialBackOffExecution implements BackOffExecution {

		private long currentInterval = -1;

		private long currentElapsedTime = 0;

		private int attempts = 0;

		@Override
		public long nextBackOff() {
			if (this.currentElapsedTime >= getMaxElapsedTime() || this.attempts >= getMaxAttempts()) {
				return STOP;
			}
			long nextInterval = computeNextInterval();
			this.currentElapsedTime += nextInterval;
			this.attempts++;
			return nextInterval;
		}

		private long computeNextInterval() {
			long maxInterval = getMaxInterval();
			long nextInterval;
			if (this.currentInterval < 0) {
				nextInterval = getInitialInterval();
			}
			else if (this.currentInterval >= maxInterval) {
				nextInterval = maxInterval;
			}
			else {
				nextInterval = Math.min((long) (this.currentInterval * getMultiplier()), maxInterval);
			}
			this.currentInterval = nextInterval;
			return Math.min(applyJitter(nextInterval), maxInterval);
		}

		private long applyJitter(long interval) {
			long jitter = getJitter();
			if (jitter > 0) {
				long initialInterval = getInitialInterval();
				long applicableJitter = jitter * (interval / initialInterval);
				long min = Math.max(interval - applicableJitter, initialInterval);
				long max = Math.min(interval + applicableJitter, getMaxInterval());
				return min + (long) (Math.random() * (max - min));
			}
			return interval;
		}

	}

}

```

## Usage

```java
  ExponentialBackOff backOff = new ExponentialBackOff();

  BackOffExecution execution = backOff.start();

  // In the operation recovery/retry loop:
  long waitInterval = execution.nextBackOff();
  if (waitInterval == BackOffExecution.STOP) {
      // do not retry operation
  }
  else {
      // sleep, for example, Thread.sleep(waitInterval)
      // retry operation
  }
```

End.