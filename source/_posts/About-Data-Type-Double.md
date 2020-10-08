---
title: 关于 double 数据类型
categories: Java & Android
toc: true
comments: true
date: 2017-03-09 14:44:43
tags:
---



最近在做订单部分，在计算下单金额的部分时，遇到了一些很诡异的现象，也花费了一些时间，决定在这里把自己的解决方案记录下来，如果大家有更好的方法，可以留言告诉我。

<!--more-->

##  诡异现象

先看下面一段代码，猜猜和你想的一样否。

```java

    public static void main(String[] args){

        double value1 = 1.2 * 399;
        System.out.println(value1);

        double value2 = 1.3 * 399;
        System.out.println(value2);
    }

```

当我看到输出结果时，吓得我立马打开了计算器，重新计算了一下，正确的值应该是 478.8 和 518.7 。看下控制台的输出：

```java
478.79999999999995
518.7
```

这个结果让我产生了研究的兴趣，在网上收集了一些资料，似乎明白其中的原因：程序执行时，都是二进制数据之间的运算，最后再转化成十进制，所以过程中会产生精度的丢失。我来计算一下这个过程：

##  计算过程

将十进制转换为二进制，这里有个[在线二进制计算器](http://cn.calcuworld.com/%E4%BA%8C%E8%BF%9B%E5%88%B6%E8%AE%A1%E7%AE%97%E5%99%A8)

1.2 = 12 ／ 10  ==》 1100 ／ 1010

399  ==》 110001111



为了避免除法的误差，这里先计算乘法再除法即：1100 * 110001111 ／1010

![二进制 乘法](/images/Binary_Chengfa.png)

![二进制 除法](/images/Binary_Chufa.png)

可以看到，最后的结果是除不尽的，为 1 1 1 0 1 1 1 1 0 .1 1 0 0 1 1 0 0 1 1 0 0 …...

Java 基础不好，特地查了一下，double类型 是 8 个字节，一个字节 8 个 bit，1 个 bit 即一个 二进制数，所以 double 有 64 个二进制位，其中 包括 ：1 个符号位，11 个指数位， 52  个尾数位。符号位表示 double 的正负值，指数位表示 double 的取值范围，尾数位就是 double 的有校位数了。2^52 = 4503599627370496，一共16位，所以 double 的精度为 16 位。但是，看下面这句话来自网络：

> 浮点数在内存中是按科学计数法来存储的，其整数部分始终是一个隐含着的“1”，由于它是不变的，故不能对精度造成影响。

所以，由于最左为1的一位省略了，这意味着最多能表示 17 位数，其中绝对能保证的为 16 位，最多表示 17 位。

我把 52 个有效数贴下来：

 1 1 1 0 1 1 1 1 0 .1 1 0 0 1 1 0 0 1 1 0 0 1 1 0 0 1 1 0 0 1 1 0 0 1 1 0 0 1 1 0 0 1 1 0 0 1 1 0 0 1 1 0 

将上面的二进制转换成十进制：

478 + 1/2 + 1/2^2 + 1/2^5 + 1/2^6 + 1/2^9 + 1/2^10  + 1/2^13 + 1/2^14 + 1/2^17 + 1/2^18 + 1/2^21+ 1/2^22 + 1/2^25 + 1/2^26 + 1/2^29 + 1/2^30+ 1/2^33 + 1/2^34 + 1/2^37 + 1/2^38 + 1/2^41 + 1/2^42  = **478.799999999999955** 。（计算器算的好累）

根据上面的精度，这里保存前 17 位 ，即 **478.79999999999995**，与 Java 程序算出来的一致。

## 解决办法

使用 BigDecimal，Java 提供这个类专门用来对超过16位有效位的数进行精确的运算。

上面的 double 乘法运算写法如下：


```java

    BigDecimal bd1 = new BigDecimal(Double.toString(1.2));
    BigDecimal bd2 = new BigDecimal(Double.toString(399));
    double value = bd1.multiply(bd2).doubleValue();
    System.out.println(value);
```

加法，减法，除法与上面类似。另外，项目中，我们很多时候，即使金额是整数或者一位小数，我们也希望显示两位小数，这里可以使用 DecimalFormat 这个类，方法如下：

```java

	private void updateServiceCharge(double currentCharge) {
		java.text.DecimalFormat df = new java.text.DecimalFormat("#.00");
		String charge = df.format(currentCharge);
		tvTotalPrice.setText("实付款 \n  ￥"+ charge);
	}

```



