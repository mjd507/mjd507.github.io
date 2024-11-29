---
title: Ask Java Architects - Open Questions
categories: Back-End
toc: false
comments: true
copyright: true
hidden: false
date: 2024-11-21 09:26:02
tags:
---


[Ask the Java Architects](https://www.youtube.com/watch?v=SPc9YpLsYo8)

<!--more-->


> these questions all about decisions we've made the current state of Java and some futures, so just think about that as you formulate your questions.


Q: **the security manager is being removed from the JDK without any form of replacement, should we expect to see more of this in the future which is worrying for some users?**

A: sounds like a deprecation question, I'll answer this with my deprecation lab code, so first of all, I think the fundamental idea of the security manager was to run untrusted code, so the **security manager was a mechanism to run untrusted code in the JDK** and in fact basically nobody does this, so now there still remains this idea of how you run untrusted code. 

in fact people do this every day using other mechanisms, using such as OS security mechanisms and container mechanisms, so the replacement mechanisms for the security manager exist and are in use, and are in widespread used in the industry today, but those mechanisms exist outside the jvm, **it's not like there's no replacement, whatsoever it's just that the replacement Technologies for the security manager are not in the JDK anymore**.

now there are a bunch of other deprecations in Flight such as finalization, such as unsafe, we will be providing mechanisms inside the JDK for those and also well we haven't deprecated serialization yet, but we are working on a replacement and you heard some ideas for how we would upgrade serialization, so for the most part we do think about what people are doing with these mechanisms, and what replacements they use they just don't always exist in the JDK.

---

Q: **would you call the security manager a peak of complexity solution?**

A: oh yes I think so.

> when someone asks a question like that they're actually not telling you a whole branch of other things, what I would say this is the story is written out carefully in [JEP 486]() , there's a whole bunch of stuff in there, I don't know the person asked the question has read it or not, with this things like how you know it references all the other things are going on and that are much more intersting to invest in rather than the security manager.
>
> good point. a lot of times we have questions that actually answers already exist. I'd encourage you if you're not already active in the open jdk project, please find the projects that interest you, follow along on the conversations because often times what you are looking for has already been stated and discussed in terms of why a decision was made, why a decision wasn't made, and then allows you to plan for that future, so definitely turn your attention to openjdk.org .

---

Q: **JEP 14 tip and tail model is for library maintainers, can you explain why it's a JDK enhancement proposal(JEP)?**

A: JEPs are not just for features that we're adding to the JDK. there are several categories of JEPs. there's a category called **process JEPs** which talk about how we do, what we do in the jdk, and there's a category called **informational JEPs** where we write down things that we think are relevant to both how the jdk is evolved but also interactions in the java ecosystem. 

so for example the preview process is documented in an informational cate and the tip and tail JEP is also a informational JEP, it has no weight of law, **there's no specification, there's no thou shalt do it this way, but it represents the gathering of understanding that we've developed through developing the JDK**. and how we think - it might benefit some libraries who may choose to adopt this model and what the advantages and cost might be.

> that leads into a whole set of other questions, because so many of our JEPs are talking about programs, projects and features that we are working on, many of you have had questions on preview features which is greate, hopefully all of you are giving us feedback on that.

---

Q: **I didn't see another preview feature of String template in JDK 23, why was it removed? who's brave enough to take that one?**

A: it was deliberate, it was a preview feature, as we say to everybody, the best thing you can do with preview features is try them out with your code and give us feedback, and you won't be surprised to hear that we are also doing the same thing, we're also trying it out with new examples and gathering our own feedback.

one of the things we discovered when we tried a particularly complicated challenging example, we found some shortcomings in the design, particularly around, for those of you played with String templates, is kind of a design with two parts, so one is a something that looks like a String literal with holes in, with expressions in those holes, and then we had like a processor which was a code that would process that template, and create a value to come out.  

we discovered that our design, not of the String literal bit with holes, but the design and the api around the processors, made it really hard for us to actually write the example that we wanted to write, in fact in some places we couldn't write the thing we wanted to write, so that made us realize perhaps **the design around the template processors was not quite right.**

at that point we I'm going to read the manual, so we read JEP 12 which tells you what to do with preview features and it says, I quote, **eventually the JEP owner must decide the preview features fate, if the decision is to remove the preview feature then the owner must file an issue in JBS to remove it, no new JEP is needed**, so we filed a bug to say we're deleting all that code and it disappeared, we did write and inform people, obviously we're discussing with the experts and so on, but that was the decision.

however it's not the end, we wanted basically we're in a position where we were sure that the design we had was not quite right, we're pretty sure we know what we want to to get the design to, but at that point it seemed like the best thing to do was to remove the preview, have a good long think, talk with the experts, and then come out with a new jab, with a new design, when we're ready the great thing of the six-monthly cycle is is not too long for another train to hop onto with a new design.

so behind the scenes, you know in Java Towers, we are working hard on the next design, and fingers crossed we'll have something to share soon.

---

Q: **some preview features are previewd one or two times, I have noticed that the Vector API is now in 2 + n preview features. what's the status on Vector API?**

A: It turns out the sorts of things that the Vector api has to do under the hood in inside the JVM, are remarkably similar to the things that Valhalla has to do, in terms of being able to flatten objects into other objects. and the code that is in there is kind of a **pale imitation** of what the Valhalla code would be, and it seemed like it would be a terrible shame to have two implementations of roughly the same thing that like didn't look exactly like each other, 

so we decided that the rational thing to do, would be to wait until JEP 401, which is the first JEP of Valhalla came into preview, and then at that point we would rebase the Vector API code on the Valhalla code, and it would go into preview at that point as well, and that actually flowed into the decision about how finely should we slice the Valhalla JEP, 

so that not only do we have a smooth delivery of features that make sense to the programmers, but also that we minimize the time that the Vector API is waiting for Valhalla , so what we ended up with in JEP 401 is kind of a nice balance of it's kind of the minimal first increment of Valhalla and it also unblocks vectors.

---

Q: **Java do already stated there are better alternatives for the Date class or Hashtable class, what is about to deprecate these kind of things?**

A: there's a set of classes in the in libraries that are obsolescent in a sense, but which are not formally deprecated, the examples are the Date class, what's interesting about the Date class is that almost every method and Constructor of Date are deprecated, except for a very carefully tuned set.

so Date, Vector, hashable, they're set of obsolete classes in that state but they're not deprecated, why not, **we will probably never actually remove them, because too much code depends on them, and that would just be incredibly disruptive, we could deprecate them not for removal.** 

what that would do is have the effect of generating a bunch of warnings, one of the problems is that since these are very old classes, they work their way into library apis, for instance the SQL libraries use date and there's some other issues with that, then there's some early mistakes that made, but what that means is that all of these libraries and all usges of these libraries would also just start to suffer warnings and if you have a warning, it might be the idea of a deprecation warning is to say, oh okay, this is that you know there are better ways to do something than to use this API, you should migrate away from it, but if you're using library that has this in its API you can't migrate away from it until the library migrates away, so it's just this endless cascade of everybody transitioning away from these old things.

so maybe in a sense they should be deprecated, maybe there should be a way to deal with warnings better, I think I'd like to do that, but that's that's still an open question so sort of conceptually they're deprecated, but we I think we need to do some more work to figure out how to deal with the situation and I think a middle ground is to document the alternatives instead so that kind of nudge users to use other classes.









