---
title: 设计模式（结构型篇 二）
categories: Data Structure & Algorithm
toc: true
comments: true
date: 2017-02-03 12:44:33
tags:
---

本文继续梳理结构型设计模式剩下的三个：**外观模式**，**享元模式**，**代理模式**。如有不同见解，或者想补充的，欢迎评论指出。完整的 23 种设计模式可移步我的 [GitHub—>DesignPattern](https://github.com/mjd507/DesignPattern)。


<!--more-->

## 外观模式

```java

/**
 * 背景：途虎与阿里合作，阿里 YunOs 的行车记录仪系统将 搭载 途虎养车 的车载应用
 * 途虎养车应用有两个桌面 widget，样式等都是由自己定义，开始都没什么问题
 * 后来，yunOs 车载系统 搭载的应用增多，阿里需要自己管理 widget 卡片风格，看我们途虎应用是如何调整的
 */

/**
 * 途虎应用 保养卡片
 */
class CarMaintenanceCard{
	public static void refreshLingQuan(){
		System.out.println("检查到了优惠券，刷新途虎自定义的优惠券页面");
	};
	public static void refreshSpecialState(){
		System.out.println("未检查到用户信息，刷新途虎自定义的提示用户登录页面");
	}
	public static void refreshMilesState(){
		System.out.println("用户距离上次保养已经又行驶了10000km了，刷新途虎自定义的里程状态页面");
	}
}

//------  阿里 YunOs 卡片增多，为同一卡片风格，需要自己管理卡片样式，但是逻辑还是途虎定义的逻辑

/**
 * 途虎应用为阿里进行了调整，增加了一个为阿里的保养卡片类
 */
class CarMaintenanceCardForAli{
	public static void refreshLingQuan(){
		System.out.println("检查到了优惠券，发送intent通知阿里刷新优惠券页面");
	};
	public static void refreshSpecialState(){
		System.out.println("未检查到用户信息，发送intent通知阿里刷新提示用户登录页面");
	}
	public static void refreshMilesState(){
		System.out.println("用户距离上次保养已经又行驶了10000km了，发送intent通知阿里刷新里程状态页面");
	}

}

//途虎应用在需要刷新卡片的点，采用门面模式，调用为阿里适配的保养卡片类, 这样原来的系统也不受到影响

/**
 * 汽车保养卡片的门面
 */
class CarMaintenaceCardRefresher{
	public static boolean isUseAliStyle = true;

	public static void refreshLingQuan(){
		if(isUseAliStyle){
			CarMaintenanceCardForAli.refreshLingQuan();
		}else{
			CarMaintenanceCard.refreshLingQuan();
		}
	};
	public static void refreshSpecialState(){
		if(isUseAliStyle){
			CarMaintenanceCardForAli.refreshSpecialState();
		}else{
			CarMaintenanceCard.refreshSpecialState();
		}
	}
	public static void refreshMilesState(){
		if(isUseAliStyle){
			CarMaintenanceCardForAli.refreshMilesState();
		}else{
			CarMaintenanceCard.refreshMilesState();
		}
	}

}

```

![Facade](https://user-images.githubusercontent.com/8939151/111023284-0ea6f580-8413-11eb-9630-dbdeb3696034.png)

外观模式又称门面模式，该模式的好处在于：调用者使用起来更加容易，无需关心每个子系统具体的处理逻辑。


## 享元模式

```java

class FlyWeightFactory{
	private static Map<String, AbsFlyWeight> map = new HashMap<String, AbsFlyWeight>();

	public static AbsFlyWeight getFlyWeight(String str){
		AbsFlyWeight flyWeight = map.get(str);
		if(flyWeight == null){
			flyWeight = new ConcreteFlyWeight(str);
			map.put(str, flyWeight);
		}
		return flyWeight;
	}
}

abstract class AbsFlyWeight{
	abstract void operation();
}

class ConcreteFlyWeight extends AbsFlyWeight{

	private String intrinsicStr; //内部的字符串

	public ConcreteFlyWeight(String str) {
		this.intrinsicStr = str;
		System.out.println( intrinsicStr + " 被创建了");
	}

	@Override
	void operation() {
		System.out.println("ConcreteFlyWeight str = " + intrinsicStr);
	}

}
```

![Flyweight](https://user-images.githubusercontent.com/8939151/111023293-1bc3e480-8413-11eb-8906-39ad0acfd403.png)

享元模式的优点在于：它能够极大的减少系统中对象的个数。缺点在于：为了使对象可以共享，需要将一些状态外部化，使得程序的逻辑复杂化。状态外部化，读取外部状态使得运行时间稍微变长。


## 代理模式

```java

interface Women{
	void happyWithMan();
}

class PanJinLian implements Women{

	@Override
	public void happyWithMan() {
		System.out.println("make love with ximenqi");
	}
	
}

class WangPo implements Women{
	private Women woman;
	
	public WangPo() {
		this.woman = new PanJinLian();
	}
	
	public WangPo(Women woman) {
		this.woman = woman;
	}

	@Override
	public void happyWithMan() {
		woman.happyWithMan();
	}
	
}
```

![Proxy](https://user-images.githubusercontent.com/8939151/111023298-29796a00-8413-11eb-947f-be6c552ae984.png)

代理模式的好处在于：起到一个中介的作用，保护了目标对象。

## 动态代理

```java

interface Person{
	void doSomething();
}

class ZhangSan implements Person{

	@Override
	public void doSomething() {
		System.out.println("coding...");
	}
	
}

class Proxyer implements InvocationHandler{
	private Object obj;//动态代理的真实对象
	
	public Proxyer(Object obj) {
		this.obj = obj;
	}

	@Override
	public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
		System.out.println("before proxy");
		method.invoke(obj, args);
		System.out.println("after proxy");
		return null;
	}
}

public static void main(String[] args) {
	ZhangSan zs = new ZhangSan();
	InvocationHandler handler = new Proxyer(zs);
	Person proxyObj = (Person) Proxy.newProxyInstance(zs.getClass().getClassLoader(), zs.getClass().getInterfaces(), handler);
	proxyObj.doSomething();
	
	//second way to use dynamic proxy
	Person newProxyInstance = (Person) Proxy.newProxyInstance(zs.getClass().getClassLoader(), zs.getClass().getInterfaces(), new InvocationHandler() {
		
		@Override
		public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
			method.invoke(zs, args);
			return null;
		}
	});
	newProxyInstance.doSomething();
}
```


