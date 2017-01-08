---
title: 设计模式——创建型篇
categories: DesignPattern
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
![SingleTon](/images/DesignPattern/creational/Singleton.png)

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
![FactoryMethod](/images/DesignPattern/creational/FactoryMethod.png)
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

![AbstractFactory](/images/DesignPattern/creational/FactoryAbstract.png)

抽象工厂模式的好处在于：屏蔽对象产品的创建细节；当产品族很多时，能够确保使用的是同一产品族中的对象；新增具体的产品族和工厂很方便。缺点就在于：新增产品对象时很不方便，需要对抽象工厂及其所有子类工厂类进行更改，这是灾难。

## 建造者模式

```java
interface CarBuilder{
	CarBuilder buildFDJ();
	CarBuilder buildLunTai();
	CarBuilder buildWaiGuan() ;
	Car build();
}

class TuHuCarBuilder implements CarBuilder{
	private TuHuCar car = new TuHuCar();

	@Override
	public CarBuilder buildFDJ() {
		System.out.println("设置了途虎发动机");
		return this;
	}

	@Override
	public CarBuilder buildLunTai() {
		System.out.println("设置了途虎轮胎");
		return this;
	}

	@Override
	public CarBuilder buildWaiGuan() {
		System.out.println("设置了途虎汽车造型");
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

class TuHuCar implements Car{

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
		CarBuilder builder = new TuHuCarBuilder();
		CarProvider carProvider = new CarProvider(builder);
		carProvider.getCar();
	}
}

```

![Builder](/images/DesignPattern/creational/Builder.png)

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

class TuHUCarProto extends CarProto{
	public void show(){
		System.out.println("this is a tuhu car proto");
	}
}

public class Prototype {
	public static void main(String[] args) throws CloneNotSupportedException {
		TuHUCarProto carProto = new TuHUCarProto();
		TuHUCarProto clone = (TuHUCarProto) carProto.clone();
		clone.show();
		System.out.println(carProto == clone);
	}
}

```

![Prototype](/images/DesignPattern/creational/Prototype.png)

原型模式的好处：使用原型模式创建对象比直接 new 一个对象在性能上要好的多，因为Object 类的 clone 方法是一个本地方法。原型模式 的 clone 有 深克隆 和 浅克隆，实现深克隆可能需要比较复杂的代码。





<br /><br /><br />

<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/"><img alt="知识共享许可协议" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-nd/3.0/cn/88x31.png" /></a><br />本作品采用<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/">知识共享署名-非商业性使用-禁止演绎 3.0 中国大陆许可协议</a>进行许可。