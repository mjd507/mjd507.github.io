---
title: JDBC and I
categories: Big-Back-End
toc: false
comments: true
copyright: true
hidden: false
date: 2024-12-22 20:31:30
tags:
---

In the past 27 years, the JDBC specification has only been released 8 versions.

<!--more-->

I was born in Nov 1993, and 3 more years later, on **1997-02-19**, **JDBC 1.0** came out. releaed by Sun. how old are you then?

since released, it has been part of Java SE. the JDBC classes are containe in the Java package **java.sql** and **javax.sql**.

this initial JDBC API, most focused on providing a basic call-level interface to
SQL databases.

---

on **2000-12-20**, JDBC 2.1 specification was released, and then on **2004-04-08**, 2.0 Optional Package specification was released, that time, I was in primary school.

both specs broadened the scope of the JDBC API to include support for more
advanced applications, and for the features required by application servers to manage use of the JDBC API on behalf of their applications.

---

on **2002-05-09**, JDBC 3.0 was released. it operated with the stated goal to round out the API by
filling in smaller areas of missing functionality.

since then, the JDBC has been developed under the [Java Community Process(JCP)](https://jcp.org/en/home/index).

what were you doing at that time?

---

when I was on Junior high school, on **2006-12-11**, JDBC 4.0 (JSR 221) was released. and was included in Java SE6, which means our application can utilze the 4.0 features when we are using Java 6 (or higher). (if our database supported 4.0)

this release introduces the concept of wrapped JDBC objects, Streaming api, Statement event, SQL Exceptions, etc.

here list the [4.0](https://docs.oracle.com/javadb/10.6.1.0/ref/rrefjdbc4_0summary.html) features.

Tell you a story, I'm not afraid of you laughing at me, until middle of this year (2024), our applications were still using this 4.0 specification, it's quite stable, especially I know it was released nearly 18 years ago. now our databased upgraded, our driver version upgraded, we are using latest specification finally :)

---

when I was on Senior high school, on **2011-10-13**, JDBC 4.1 (JSR 221) was released, and was included in Java SE7, here are the [4.1](https://docs.oracle.com/javadb/10.8.2.2/ref/rrefjdbc4_1summary.html) features.

---

on **2014-03-04**, I was in college, studying computer programming, Java is also one of my courses, on that day, JDBC 4.2 released, which [4.2](https://docs.oracle.com/javadb/10.10.1.2/ref/rrefjdbc4_2summary.html) features present only in a JDK 8 or higher environment.

I miss college times so much.

---

on **2017-09-21**, the lastest version so far, JDBC specification 4.3 released, hard to believe already 7 years.

I have been working since 2016, right after I graduated from college. I am always in software develper domain, I write this article also because I read the 4.3 specification today.

Many feelings came up in my mind. 

It's a pity I met this book too late. 

it made me realize some problems in work. as a developer, I didn't know any JDBC Specifications. in more than 8 years work.

---


[PDF for JDBC 4.3 Specification](https://download.oracle.com/otn-pub/jcp/jdbc-4_3-mrel3-eval-spec/jdbc4.3-fr-spec.pdf)
[JCP for JDBC 4.3 Specification](https://jcp.org/en/jsr/detail?id=221), I see a new **Maintenance Review Ballot 3** will start at 2025-01-07, a new specification may come.


End.