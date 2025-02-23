---
title: 设计模式（创建型篇）
categories: Big-Back-End
toc: true
comments: true
date: 2017-01-08 11:43:48
tags:
---

创建型设计模式有五个：**单例模式**，**工厂方法模式**，**抽象工厂模式**，**建造者模式**，**原型模式**。这一系列全部使用极其简洁的方式来阐述，一个模式对应一段 Java 代码以及一张 UML 类图，所有均为个人原创，如有不同见解，或者想补充的，欢迎评论指出。完整的 23 种设计模式可移步我的 [GitHub—>DesignPattern](https://github.com/mjd507/DesignPattern)。

<!--more-->

## 单例模式

```java
public class Singleton {
	private static Singleton instance = null;

	private Singleton(){
	}

	public static Singleton getInstance(){
		if(instance == null){
			synchronized (Singleton.class) {
				if(instance == null){
					instance = new Singleton();
				}
			}
		}
		return instance;
	}

}
```

![SingleTon](https://user-images.githubusercontent.com/8939151/111023109-0ef2c100-8412-11eb-8201-1fbebffb4e8e.png)


单例模式的好处在于保证了一个类在系统内存中只有一个实例对象，对于一些需要频繁地创建和销毁的对象来说使用单例可以提高系统性能。但使用单例时，要注意一些对象的引用及时释放，避免造成内存泄漏等问题。

## 工厂方法模式

```java
/**
 * 产品接口
 */
interface Balls{
	
}

/**
 * 具体产品
 */
class BasketBall implements Balls{
	public BasketBall() {
		System.out.println("篮球被生产了");
	}
}

class footBall implements Balls{
	public footBall() {
		System.out.println("足球被生产了");
	}
}

/**
 * 工厂接口
 */
interface Factory{
	Balls makeBalls();
}

/**
 * 具体工厂
 */
class BasketBallFactory implements Factory{

	@Override
	public Balls makeBalls() {
		return new BasketBall();
	}
}

class FootBallFactory implements Factory{

	@Override
	public Balls makeBalls() {
		return new footBall();
	}
}

public class FactoryMethod {
	public static void main(String[] args) {
		Factory factory = new FootBallFactory();
		factory.makeBalls();
	}
}
```

![FactoryMethod](https://user-images.githubusercontent.com/8939151/111023125-2a5dcc00-8412-11eb-9f99-d87d5fca9761.png)
工厂方法模式好处在于：完全屏蔽了对象创建的过程，交由对应的工厂来完成。当对象增加，工厂代码依然清晰。这种模式的不足在于：当对象越来越多时，会使工厂类也相应的增多，造成代码类成倍地增加。

## 抽象工厂模式

```java
/**
 * 产品接口
 */
interface AbsBalls{

}
interface AbsShoes{

}

/**
 * 具体产品
 */
class NikeBall implements AbsBalls{
	public NikeBall() {
		System.out.println("Nike篮球被生产了");
	}
}
class NikeShoes implements AbsShoes{
	public NikeShoes() {
		System.out.println("Nike鞋被生产了");
	}
}

/**
 * 工厂接口
 */
interface AbsFactory{
	AbsBalls makeBalls();
	AbsShoes makeShoes();
}

/**
 * 具体工厂
 */
class NikeFactory implements AbsFactory{

	@Override
	public AbsBalls makeBalls() {
		return new NikeBall();
	}

	@Override
	public AbsShoes makeShoes() {
		return new NikeShoes();
	}
}

public class FactoryAbstract {
	public static void main(String[] args) {
		AbsFactory factory = new NikeFactory();
		factory.makeBalls();
		factory.makeShoes();
	}
}
```

![AbstractFactory](https://user-images.githubusercontent.com/8939151/111023139-42355000-8412-11eb-8f17-647ef5cb800a.png)

抽象工厂模式的好处在于：屏蔽对象产品的创建细节；当产品族很多时，能够确保使用的是同一产品族中的对象；新增具体的产品族和工厂很方便。缺点就在于：新增产品对象时很不方便，需要对抽象工厂及其所有子类工厂类进行更改，这是灾难。

## 建造者模式

```java
interface CarBuilder{
	CarBuilder buildFDJ();
	CarBuilder buildLunTai();
	CarBuilder buildWaiGuan() ;
	Car build();
}

class SpecificCarBuilder implements CarBuilder{
	private SpecificCar car = new SpecificCar();

	@Override
	public CarBuilder buildFDJ() {
		System.out.println("设置了某公司发动机");
		return this;
	}

	@Override
	public CarBuilder buildLunTai() {
		System.out.println("设置了某公司轮胎");
		return this;
	}

	@Override
	public CarBuilder buildWaiGuan() {
		System.out.println("设置了某公司汽车造型");
		return this;
	}

	@Override
	public Car build() {
		System.out.println("汽车构造完成");
		return car;
	}

}

interface Car{
	void setFDJ();
	void setLunTai();
	void setWaiGuan();
}

class SpecificCar implements Car{

	@Override
	public void setFDJ() {
	}

	@Override
	public void setLunTai() {
	}

	@Override
	public void setWaiGuan() {
	}

}

class CarProvider{
	private CarBuilder builder;
	
	public CarProvider(CarBuilder builder){
		this.builder = builder;
	}
	
	public Car getCar(){
		Car car = builder.buildFDJ().buildLunTai().buildWaiGuan().build();
		return car;
	}
	
}

public class Builder {

	public static void main(String[] args) {
		CarBuilder builder = new SpecificCarBuilder();
		CarProvider carProvider = new CarProvider(builder);
		carProvider.getCar();
	}
}

```

![Builder](https://user-images.githubusercontent.com/8939151/111023161-62fda580-8412-11eb-8b0b-453e2903a926.png)

建造者模式将一个复杂对象的构建与它的表示分离，使得同样的构建过程可以创建不同的表示。Effective Java 中，还提到使用 Builder 模式处理需要很多参数的构造函数，常见于 JavaBeen 中。

## 原型模式

```java
class CarProto implements Cloneable{  
	
	@Override
	public CarProto clone()  {
		CarProto clone = null;
		try {
			clone = (CarProto)super.clone();
		} catch (CloneNotSupportedException e) {
			e.printStackTrace();
		}
		return clone;
	}
}  

class SpecificCarProto extends CarProto{
	public void show(){
		System.out.println("this is a Specific car proto");
	}
}

public class Prototype {
	public static void main(String[] args) throws CloneNotSupportedException {
		SpecificCarProto carProto = new SpecificCarProto();
		SpecificCarProto clone = (SpecificCarProto) carProto.clone();
		clone.show();
		System.out.println(carProto == clone);
	}
}

```

![Prototype](https://user-images.githubusercontent.com/8939151/111023167-73158500-8412-11eb-87c4-6365b471a164.png)

原型模式的好处：使用原型模式创建对象比直接 new 一个对象在性能上要好的多，因为Object 类的 clone 方法是一个本地方法。原型模式 的 clone 有 深克隆 和 浅克隆，实现深克隆可能需要比较复杂的代码。


