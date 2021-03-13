---
title: 设计模式（行为型篇 一）
categories: Data Structure & Algorithm
toc: true
comments: true
date: 2017-02-04 16:07:13
tags:
---

行为型设计模式共有 11 个，本文简单梳理其中四个：**责任链模式**，**命令模式**，**解释器模式**，**迭代器模式**。如有不同见解，或者想补充的，欢迎评论指出。完整的 23 种设计模式可移步我的 [GitHub—>DesignPattern](https://github.com/mjd507/DesignPattern)。

<!--more-->

## 责任链模式

```java

enum HolidayType{
	SHORT, Medium, LONG;
}


/**
 * 假期申请
 */
class HolidayRequest{
	private HolidayType type;
	public HolidayRequest(HolidayType type) {
		this.type = type;
	}
	public HolidayType getHolidayType(){
		return type;
	}
}


/**
 * 请求处理
 */
abstract class RequestHandler{

	protected RequestHandler nextHandler;

	public RequestHandler(RequestHandler nextHandler) {
		this.nextHandler = nextHandler;
	}

	public abstract void handleHoliday(HolidayRequest holidayRequest);
}


/**
 * 项目经理审批
 */
class PMHandler extends RequestHandler{

	public PMHandler(RequestHandler nextHandler) {
		super(nextHandler);
	}

	@Override
	public void handleHoliday(HolidayRequest holidayRequest) {
		HolidayType type = holidayRequest.getHolidayType();
		if(type == HolidayType.SHORT){
			System.out.println("项目经理内部同意休假，不扣工资");
		}else{
			System.out.println("项目经理觉得假期过长，提交人事部处理");
			nextHandler.handleHoliday(holidayRequest);
		}
	}

}

/**
 * 人事部审批
 */
class HRHandler extends RequestHandler{

	public HRHandler(RequestHandler nextHandler) {
		super(nextHandler);
	}

	@Override
	public void handleHoliday(HolidayRequest holidayRequest) {
		System.out.println("人事部同意休假，要扣工资的哦~");
	}

}

```

![Chain](https://user-images.githubusercontent.com/8939151/111022749-b15d7500-840f-11eb-9793-94df15d5109d.png)

责任链模式的好处在于：责任的分担。每个类只需要处理自己该处理的工作（不该处理的传递给下一个对象完成），提高系统的灵活性和可扩展性。缺点： 因为处理时以链的形式在对象间传递消息，根据实现方式不同，有可能会影响处理的速度。


## 命令模式

```java
class Student{
	void doHomeWork(){
		System.out.println("I'm writing.... what the fucking homework!");
	}
}

/**
 * 命令调用者（发布者）
 */
class Teacher {
	private TaskCommand command;
	public void setTaskCommand(TaskCommand command){
		this.command = command;
	}
	public void doHomeWork(){
		command.doHomeWork();
	}
}

/**
 * 任务命令接口
 */
interface TaskCommand{
	//做作业去
	void doHomeWork();
}

/**
 * 具体的命令实现
 */
class ConcreteTask implements TaskCommand{
	private Student student;

	public ConcreteTask(Student student) {
		this.student = student;
	}

	@Override
	public void doHomeWork() {
		this.student.doHomeWork();
	}

}
```

![Command](https://user-images.githubusercontent.com/8939151/111022757-c508db80-840f-11eb-9185-9efe32d44d34.png)


命令模式的好处在于：1.降低对象之间的耦合度。2.新的命令可以很容易地加入到系统中。3.可以比较容易地设计一个组合命令。4.调用同一方法实现不同的功能
缺点在于：可能会导致某些系统有过多的具体命令类。因为针对每一个命令都需要设计一个具体命令类，因此某些系统可能需要大量具体命令类，这将影响命令模式的使用。


## 解释器模式

```java

interface Expression {  
	boolean interpret();  
}  

class And implements Expression {  

	private Expression left,right;  

	public And(Expression left,Expression right){  
		this.left=left;  
		this.right=right;  
	}  

	public boolean interpret() {  
		return left.interpret() && right.interpret();  
	}  
}

class Or implements Expression {  
	private Expression left, right;  
	public Or(Expression left, Expression right) {  
		this.left = left;  
		this.right = right;  
	}  

	public boolean interpret() {  
		return left.interpret() || right.interpret();  
	}  
}

class Not implements Expression{  

	private boolean value;  

	public Not(boolean value){  
		this.value= value;  
	}  

	public boolean interpret() {  
		return !value;  
	}  
}
```

![Interpreter](https://user-images.githubusercontent.com/8939151/111022766-d3ef8e00-840f-11eb-8b8a-48f0574ba203.png)

解释器模式的好处在于：扩展性。缺点在于：会引起类膨胀以及效率问题。


## 迭代器模式

```java

interface IEmployees{
	void add(String name,int age,int salary);
	String getEmployeesInfo();
	EmployeeIterator iterator();
}


class Employees implements IEmployees{
	private String name;
	private int age;
	private int salary;
	private List<Employees> employeesList = new ArrayList<>();

	public Employees(){

	}

	private Employees(String name, int age, int salary) {
		this.name = name;
		this.age = age;
		this.salary = salary;
	}

	@Override
	public void add(String name, int age, int salary) {
		Employees employees = new Employees(name,age,salary);
		employeesList.add(employees);
	}

	@Override
	public String getEmployeesInfo() {
		String str = "员工："+ this.name +", 年龄："+ this.age+", 薪水："+this.salary;
		return str;
	}

	@Override
	public EmployeeIterator iterator() {
		return new EmployeeIterator(employeesList);
	}

}

class EmployeeIterator implements java.util.Iterator<Employees>{
	private List<Employees> employeesList;
	private int currentItem = 0;
	public EmployeeIterator(List<Employees> employeesList) {
		this.employeesList = employeesList;
	}

	@Override
	public boolean hasNext() {
		boolean hasNext = true;
		if(currentItem >= employeesList.size() || employeesList.get(this.currentItem) == null){ 
			hasNext =false;
		}
		return hasNext;
	}

	@Override
	public Employees next() {
		return employeesList.get(currentItem++);
	}

}
```

![Iterator](https://user-images.githubusercontent.com/8939151/111022780-e5389a80-840f-11eb-8b49-185c15ab2318.png)

迭代器模式的好处在于：分离了聚合对象的遍历行为，抽象出一个迭代器来负责这样既可以做到不暴露集合的内部结构，又可让外部代码透明的访问集合内部数据。


