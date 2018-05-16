---
title: 设计模式（结构型篇 一）
categories: DesignPattern
toc: true
comments: true
date: 2017-01-31 16:51:43
tags:
---

结构型设计模式共有 7 个，本文简单梳理其中四个：**适配器模式**，**桥梁模式**，**组合模式**，**装饰者模式**。如有不同见解，或者想补充的，欢迎评论指出。完整的 23 种设计模式可移步我的 [GitHub—>DesignPattern](https://github.com/mjd507/DesignPattern)。

<!--more-->

## 适配器模式
```java
/**
 * 背景：某公司app天气接口使用的是中国气象网的，后来与阿里巴巴合作，需要改用阿里的天气
 */

/**
 * 某公司数据接口
 */
interface ThirdData{
	String getWeatherFromChina();
}

/**
 * 某公司app实现该接口获取中国气象网天气
 */
class ThirdApp implements ThirdData{

	@Override
	public String getWeatherFromChina() {
		return "ThirdWeather：上海：25℃...";
	}

}
/**
 * 阿里巴巴的数据接口
 */
interface AliBaBaDate{
	String getWeatherFromAliBaBa();
}

/**
 * 阿里获取自家的天气数据
 */
class AliBaBaServer implements AliBaBaDate{

	@Override
	public String getWeatherFromAliBaBa() {
		return "AliBaBaWeather：上海：24℃...";
	}
}

/**
 * 某公司使用了适配器，不改变原有业务逻辑的基础上，使用阿里的天气数据
 */
//类的适配器模式
class ThirdWeatherAdapter extends AliBaBaServer implements ThirdData{

	@Override
	public String getWeatherFromChina() {
		return getWeatherFromAliBaBa();
	}

}

//对象的适配器模式
class ThirdWeatherAdapter2 implements ThirdData{
	AliBaBaServer aliBaBaServer;
	public ThirdWeatherAdapter2(AliBaBaServer aliBaBaServe) {
		this.aliBaBaServer = aliBaBaServe;
	}
	@Override
	public String getWeatherFromChina() {
		return aliBaBaServer.getWeatherFromAliBaBa();
	}

}

```
![Adapter](/images/DesignPattern/structural/Adapter.png)

适配器模式主要在程序扩展时使用，一般不会在系统设计时采用。该模式的好处在于扩展时能减少原有代码的修改，使风险降低。


## 桥梁模式

```java

//--------------- 业务实现角色 ----------------

abstract class Video{
	abstract void makeVideo();
}

class AVIVideo extends Video{

	@Override
	void makeVideo() {
		System.out.println("制造了 avi 格式的视频");
	}
}

class WMVVideo extends Video{
	
	@Override
	void makeVideo() {
		System.out.println("制造了 wmv 格式的视频");
	}
}


//--------------- 业务抽象角色 ----------------

abstract class VideoPlayer{
	protected Video video;
	public VideoPlayer(Video video) {
		this.video = video;
	}
	protected void playVideo(){
		video.makeVideo();
	}
}

class MacVideoPlayer extends VideoPlayer{

	public MacVideoPlayer(Video video) {
		super(video);
	}

	@Override
	protected void playVideo() {
		super.playVideo();
		System.out.println("mac os 播放了"+ video.getClass().getSimpleName().substring(0,3) +" 格式的视频");
	}
}

class WindowsVideoPlayer extends VideoPlayer{
	public WindowsVideoPlayer(Video video) {
		super(video);
	}

	@Override
	protected void playVideo() {
		super.playVideo();
		System.out.println("windows os 播放了"+ video.getClass().getSimpleName().substring(0,3) +" 格式的视频");
	}
}
```

![Bridge](/images/DesignPattern/structural/Bridge.png)

桥梁模式的好处在于：隔离了抽象和实现，两边都能自由扩展。缺点在于：聚合关系建立在抽象层，增加系统的理解与设计难度。


## 组合模式

```java

/**
 * 超市
 */
abstract class Market{
	
	String MarketName;
	
	public abstract void add(Market m);
	
	public abstract void AliPay();
	
}

/**
 * 大润发(单个)
 */
class RTMarket extends Market{
	
	public RTMarket(String name) {
		this.MarketName = name;
	}

	@Override
	public void add(Market m) {
		//do nothing
	}

	@Override
	public void AliPay() {
		System.out.println(MarketName + ":使用了阿里支付");
	}
	
}

/**
 * 所以超市的管理者（组合）
 */
class MarketControler extends Market{
	private List<Market> marketList = new ArrayList<>();
	
	public MarketControler(String name) {
		this.MarketName = name;
	}


	@Override
	public void add(Market m) {
		marketList.add(m);
	}

	@Override
	public void AliPay() {
		for (Market market : marketList) {
			market.AliPay();
		}
	}
	
}
```

![Composite](/images/DesignPattern/structural/Composite.png)

组合模式的优点在于：可以很容易的增加新的构件。
缺点在于：控制树枝构件的类型不太容易。用继承的方法来增加新的行为很困难。


## 装饰者模式

```java

interface House{
	void build(); 
	void design(); 
}

class MyHouse implements House{

	@Override
	public void build() {
		System.out.println("我的房子得有三室一厅...");
	}

	@Override
	public void design() {
		System.out.println("我的房子要装修成这样....");
	}
}

/**
 * 装饰者：专注房屋装修
 */
class HouseDecorator implements House{
	private House house;
	public HouseDecorator(House house){
		this.house = house;
	}

	@Override
	public void build() {
		System.out.println("构造前，专业团队先分析一下....");
		house.build();
		System.out.println("构造后，专业团队再检验一下....");
	}

	@Override
	public void design() {
		System.out.println("装修前，专业团队先分析一下....");
		house.design();
		System.out.println("装修后，专业团队再检验一下....");
	}
	
	//我们装修者还提供了售后服务
	public void futureServices(){
		System.out.println("3年以内任何问题，免费上门服务");
	}
}

```

![Decorator](/images/DesignPattern/structural/Decorator.png)

装饰者模式的好处在于：比起继承，包装对象的功能更加灵活。运行时选择不同的装饰器，可以实现不同的功能。缺点：会导致设计中出现许多小类，如果过度使用，会使程序变得很复杂。


