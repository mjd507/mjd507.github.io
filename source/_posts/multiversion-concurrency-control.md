---
title: Multiversion concurrency control
categories: Big-Back-End
toc: false
comments: true
copyright: true
hidden: false
date: 2024-09-15 08:33:12
tags:
---

[Vlad: How does MVCC work](https://vladmihalcea.com/how-does-mvcc-multi-version-concurrency-control-work/)

[Optimistic vs Pessimistic](https://stackoverflow.com/questions/129329/optimistic-vs-pessimistic-locking)

[Pessimistic vs Serializable](https://stackoverflow.com/questions/47441027/pessimistic-locking-vs-serializable-transaction-isolation-level)

[Lost Update In Oracle](https://stackoverflow.com/questions/24017303/why-is-it-a-lost-update-in-the-read-committed-transactions-example-of-oracle-d)
<!--more-->

------

My simple understanding of MvCC.


1. as the names says, it's for multi concurrency request handling.

2. it's the mechanism for handling concurrency on **same record(s)**.

3. when talking concurrency, **lost update** always needs to be considered.

------

- Locking: Pessmistic and Optimistic Locking

    Pessmistic: avoid race conditions.

    Optimistic: allow conflicts happen.

- MVCC is kind of Optimistic mechanism.

------

4. MVCC provide multi version of data(snapshot) for multi transactions.

5. in transaction, the visibility of the version-data is depending on the isolation level.

6. the higher isolation level is, the lower performance.

7. deadlock cases:
    
    transaction A holds record A waiting record B, transaction B holds record B waiting record A.

    make multi records update in same order.

8. make transaction small, avoid external call. ([Transactional-Outbox-Pattern](https://mjd507.github.io/2024/07/06/Transactional-Outbox-Pattern/))

