---
title: 了解正则的最佳姿势
categories: 
toc: true
comments: true
copyright: true
date: 2017-07-29 10:33:18
tags:
---

正则，简单来讲就是用来查找文本中符合特定模式的字符串的。它究竟有多实用，相信倒腾过爬虫的人都知道。抓取接口的时候，返回的多数是些 HTML 标签，这些对我们来讲是没有多大用处的，提取出标签内的内容才是关键，而通过正则表达式则能很好的进行筛选。

<!--more-->

假设一个网站的用户名成由小写字母，数字下划线和横杠组成，并且只能有3到15个字符，那么该如何写出这个正则表达式？

![](/images/regex_username.png)

## 基本匹配

文本直接按照正则表达式的字母和数字进行匹配。

```java
"cat" => The cat sat on the mat
```

正则表达式大小写敏感，所以 Cat 与 cat 不匹配。

```java
"Cat" => The cat sat on the Cat
```

## 元字符匹配

元字符不代表自己，是具有特殊意义的专用字符。一些**写在方括号内的元字符**还有特别的含义。

|  元字符  |                    含义                    |
| :---: | :--------------------------------------: |
|   ^   |                 匹配输入的开头                  |
|   $   |                 匹配输入的结尾                  |
|   .   |           匹配除换行符以外的任何**单个**字符            |
|   *   |            匹配前面的符号 **0次或多次**             |
|   +   |            匹配前面的符号 **1次或多次**             |
|   ?   |                 使前面的符号可选                 |
|   l   |          匹配符号之前的字符**或者**符号之后的字符          |
|   \   | 转义，允许你匹配保留字符，如  [ ] ( ) { } . * + ? ^ $ \ l |
| {m,n} |           匹配至少 m 个字符，最多 n 个字符            |
| (xyz) |            字符组，按照确定的顺序匹配 xyz             |
|  [ ]  |            字符类，匹配方括号之间的任何字符。             |
| [^ ]  |          非字符类。匹配不包含方括号之间字符的任何字符          |

## 简写字符集

对于常用的字符集，正则表达式提供了简化的写法。

|  简写  |           含义           |
| :--: | :--------------------: |
|  \w  | 匹配字母数字下划线 [a-zA-Z0-9_] |
|  \W  |  匹配非字母数字下划线字符 [^ \w\]  |
|  \d  |       匹配数字 [0-9]       |
|  \D  |     匹配非数字 [^ \d\]      |
|  \s  |  匹配空格 [\t\n\f\r\p{Z}]  |
|  \S  |      匹配空格 [^ \s\]      |

## 标识

一些标识也会影响正则匹配的输出，它们可以以任何顺序或组合使用，并且是RegExp的组成部分。

|  标识  |    含义    |
| :--: | :------: |
|  i   | 匹配不区分大小写 |
|  g   |   全局搜索   |
|  m   |   多行搜索   |

## 正向反向预查

正向查找和反向查找，用于匹配特定的模式，但不包括在匹配列表中。**JavaScript 不支持反向预查**

|  标识  |   含义   |              解释               |
| :--: | :----: | :---------------------------: |
|  ?=  | 正向肯定查找 |  foo(?=bar) 匹配后面跟着 bar 的 foo  |
|  ?!  | 正向否定查找 | foo(?!bar) 匹配后面不跟着 bar 的 foo  |
| ?<=  | 反向肯定查找 | (?<=foo)bar 匹配前面跟着 foo 的 bar  |
| ?<！  | 反向否定查找 | (?<！foo)bar 匹配前面不跟着 foo 的 bar |


> **Tips**
还有一种标识 **?:**  也是正向查找，与 **?=** 的区别在于：**?=** 后面的内容仅仅是作为匹配模式，但不会出现在整体匹配结果中，**?:** 后面的内容也是作为匹配模式，但会出现在整体的匹配结果中。
另外一种情况，括号内的字符可以提取，而**?:** 后面的结果不会单独匹配。
举个列子:
```javascript
const reg1 = /ab(c)/;
const reg2 = /ab(?:c)/;
const str = 'abc';
str.match(reg1);  //["abc"]  [c]
str.match(reg2);  //["abc"]
```

## 例子（JS 实现）

- 字符串`const str = "The fat cat sat on the mat."` 匹配其中的 the 

  ```javascript
  /the/.test(str);  //true
  ```

- 字符串`const str = "The car parked in the garage."` 匹配其中的 任意**单个**字符开头，以 ar 结尾的字符

  ```javascript
  const matchArr = str.match(/.ar/g);
  ```

- 字符串`const str = "The car parked in the garage."` 匹配其中的  car 或 par 或 gar 

  ```javascript
  const matchArr = str.match(/(c|p|g)ar/g);
  ```

- 匹配任意的字符串

  ```javascript
  const matchArr = str.match(/.*/);
  ```

- 字符串`const str = "The fat cat sat on the concatenation."` 匹配其中左右带有空格的 cat

  ```javascript
  const matchArr = str.match(/\scat\s/);
  ```

- 字符串`const str = "The fat cat sat on the mat."` 匹配以 c 开始，到最后一个 t 结尾

  ```javascript
  const matchArr = str.match(/c.+t/);
  ```

- ​字符串`const str = "The car is parked in the garage."` 匹配当中的 The 或 the

  ```javascript
  const matchArr = str.match(/[Tt]he/g);
  const matchArr = str.match(/(T|t)he/g);
  ```

- 字符串`const str = "The car is parked in the garage."` 匹配当中的 The 或 he

  ```javascript
  const matchArr = str.match(/[T]?he/g);
  ```

- ​字符串`const str = "The number was 9.9997 but we rounded it off to 10.0."` 匹配当中至少两位**连续的**数字

  ```javascript
  const matchArr = str.match(/[0-9]{2,}/g);
  ```

- 字符串`const str = "The car is parked in the garage."` 判断是否以 T 开头，以.结尾

  ```javascript
  /^T.*.$/.test(str);
  ```

- 字符串`const str = "Java7 Java8  Javascript7 Javascript8"` 匹配 Java，要求是在数字 8 之前的 Java

  ```javascript
  const matchArr = str.match(/Java(?=8)/g);
  ```

- 字符串`const str = "Java7 Java8  Javascript7 Javascript8"` 匹配 Java，要求不是在数字 8 之前的 Java

  ```javascript
  const matchArr = str.match(/Java(?!8)/g);
  ```


- 字符串`const str = "$4.44 and $10.88 and $ and 123.45"` 匹配紧跟着 $ 后面的金额，包含小数点

  ```php
  /(?<=\$)[\d\.]+/g  //javascript 没有反向查找
  ```


- 字符串`const str = "$4.44 and $10.88 and $ and 123.45"` 匹配不紧跟着 $ 后面的金额，包含小数点

  ```php
  /(?<!\$)[\d\.]+/g  //javascript 没有反向查找
  ```


- 匹配手机号码 

  ```javascript
  /^1\d{10}$/.test('13812341234')
  ```

  > 移动：134、135、136、137、138、139、147、150、151、152、157、158、159、178、182、183、184、187、188
  > 联通：130、131、132、145、155、156、175、176、185、186
  > 电信：133、153、173、177、180、181、189
  > 虚拟运营商：170

  `^((13[0-9])|(14[57])|(15[0-3|5-9])|(17[03|5-8])|(18[0-9]))\d{8}$`

- 匹配邮箱地址 

  ```javascript
  /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})*$/
  ```

- 匹配链接

  ```javascript
  /^((http|https):\/\/)?[^\s]*$/
  ```

  ```javascript
  /^(((http|https|ftp):\/\/)?([[a-zA-Z0-9]\-\.])+(\.)([[a-zA-Z0-9]]){2,4}([[a-zA-Z0-9]\/+=%&_\.~?\-]*))*$/
  ```

  ​

## 参考文章

[learn-regex](https://github.com/zeeshanu/learn-regex)

[正则表达式 -- MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Regular_Expressions)

