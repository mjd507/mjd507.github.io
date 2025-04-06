---
title: Revisited-Design-Patterns-In-Modern-Java
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2025-03-11 21:37:41
tags:
---

> The more design patterns we talk about, the less powerful a language is.
> The more powerful a language is, the more we will use integrated features than design patterns.

list few design patterns which are really excited to use with the evolution of Java.

https://www.youtube.com/watch?v=kE5M6bwruhw

<!--more-->

## Iterator Pattern

```java
// external iterator - Imperative style of programming
for(var name: names) {
  //...
}

// internal iterator - Functional programming
names.forEach((item)->{
  //...
})

```

## Lightweight Strategy

we have an algorithm and we want to vary a small part of it.

Java started out with OO ideology.

Java 1.1 we had anonymous inner classes
we would create an interface for a Strategy
we create a bunch of classes or anonymous inner classes to implement that interface.

Step back: what is really a strategy?
It is definitely not a class.

Fundamentally, a strategy is a function.

Naturally, strategies can be implemented using lambdas.

```java
int totalValue(List<Integer> values, Predicate<Integer> selector) {
  return values.stream()
     .filter(selector)
     .mapToInt(e -> e)
     .sum();
}
```

Refactor before you add a feature or after you add a feature, but never in the middle.

Programming is 10% skill and 90% discipline.


## Factory Method using default methods

Factory - an abstraction to create an object
Method - inheritance hiearachy where we can override a method to provide an alternative implementation that we return

Typically we have a base class(abstract) and derived classes that override the 'factory' method.

```java
interface Player {
  Pet getPlayer();
  default void play() {
    getPlayer().play();
  }
}

interface Pet {}
class Dog extends Pet {}
class Pig extends Pet {}

class DogPlayer implement Player {
  Pet getPlayer() {
    return new Dog();
  }
}

```

## Laziness using Lambda Expressions

In programming we have two ways to pass data to function:
- applicative order - most of us are used to - the order of evaluation is the order of call or application.
- normal order - is rather abnormal or very rare, languages like Haskell do this extensively.

In Computer Science, we can solve almost any problem by using one more level of *indirection*.

lambdas are indirection in Functional Programming as polymorphism in OOP and Pointers in procedural (C).


```java
void compute(int num) {
  // assume it is a slow computing...
  return num*2;
}
void operate(int num) {
  if (Math.random() > 0.5) {
    // using num from parameter
  } else {
    // continue without using parameter value
  }
}
operate(compute(20)); // applicative order



void operate(Supplier<Integer> supplier) {
  if (Math.random() > 0.5) {
    // using num from supplier, supplier.get();
  } else {
    // continue without using parameter value
  }
}
operate(() -> compute(20)); // normal order

```


## Decorator using Lambda Expression

Functions are composable.

```java
class Camera {
  private Function<Color,Color> filter;
  public Camera(Function<Color,Color>... filters) {
    /*
    filter = input -> input;
    for (var aFilter: filters) {
      filter = filter.andThen(aFilter)
    }
    */
    filter = Stream.of(filters)
              .reduce(Function.identity(), Function::andThen);
  }
  public Color snap (Color input) {
    return filter.apply(input);
  }
}

void process(Camera camera) {
  camera.snap(new Color(125,125,125));
}

process(new Camera(Color::brighter, Color::darker));
```

we can combine a series of policies, filters, data clensers ...


## Creating fluent interfaces and Execute around Method Pattern


```java
void use(Consumer<Resource> block) {
  try(Resource resource = new Resource()){
    block.accept(resource);
  }
}

use(res -> res.op1().op2());
```

## Creating a closed hierachy with sealed

your library has two kinds of interfaces:
1. for others to implement
2. for others only to use

```java
sealed interface TrafficLight permits RedLight,GreenLight,YellowLight {}
```

## OOP vs Data Oriented Programming

Paradigms are there to help us and not the other way around.

OOP is awesome it helps us to develop extensible code.

But there are times when using OOP may lead to bloated code with many level of hierachy that makes the code cumbsome and hard to maintain.


Suppose you are creating a hiearchy of classes.

Vehicle
Car
Truck

Your Vehicle can have an abstract method and your Car and Truck can override that method. polymorphism at work.

aVehicle.drive()

where depending on aVehicle at runtime, it may refer to a Car or a Truck and the approriate drive is called for us.

If we add antoher type of Vehicle, say a Boat, we can rely on polymorphism to make the calling code extensible without having to change. Open Closed Principle.


Suppose you are using a third-party library with a hiearchy of classes. You have to implement logic that is different from classes in that hiearchy.


What is the OOP solution for this?

Could use visitor pattern.
Create a parallel hiearchy of classes.

```
        VehicleProcessor             Vehicle
   CarProcessor TruckProcessor      Car   Truck
```
1. a lot of code to write
2. boated
3. hard to understand where all the logic is being done.
4. Little little code spared out in so many places.


Data Oriented Programming. works really well when dealing with a third-party hiearcy of data.
```java
// from a third-party lib
interface Vehicle {}
class Car implement Vehicle {}
class Truck implement Vehicle {}

String process(Vehicle vehicle) {
  return switch(vehicle) {
    case Car car -> "processing Car... Logic goes here";
    case Truck truck -> "processing Truck... Logic goes here";
  }
}
```

