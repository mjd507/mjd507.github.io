---
title: 制作 PPT 和流程图的超酷姿势
categories: 其他
toc: true
comments: true
copyright: true
date: 2017-10-07 12:38:29
tags:
---


本次介绍两个极具极客范的操作，相信看完后，你会迫不及待地想要实践起来。这两个操作都是基于 Markdown 语法，这是我个人极力推荐的一种语法，甚至看到有些公司强制要求产品经理的文档必须用 Markdown 来写，如果你还不了解的话，真的是 out 了。

<!--more-->

## 画流程图

当遇到逻辑性，或者流程性的业务比较多的时候，我们通常都会画图，画流程图，先前的做法，就是打开某种画图软件，然后，选一个方形，椭圆形，线条之类的，不仅浪费时间，而且改动很麻烦，而现在有了 Markdown 语法，你只需要简单几行代码，就可以自动绘制出一个流程图。下面看个例子。

轮胎列表页车型流程图

```
tireList=>start: 轮胎列表
isCarSuit=>condition: 车型是否匹配?
op=>operation: 进入车型库匹配(redirect)
isMatch=>condition: 车型是否完成匹配?
end=>end
tireList2=>operation: 新轮胎列表
back=>operation: 返回上级

tireList->isCarSuit
isCarSuit(yes)->end
isCarSuit(no)->op->isMatch
isMatch(yes)->tireList2
isMatch(no)->back
```

上面代码在能识别流程图 Markdown 的编辑器里面的效果是这样的：
![自动生成的流程图](https://user-images.githubusercontent.com/8939151/111025209-9eea3800-841d-11eb-9c8f-403d89c312fa.png)

十几行代码画出一张流程图，真特么爽。下面这个就更厉害了。

## 制作 PPT

当要做一个分享，多数需要做一个 PPT，之前做 PPT 的方式无外乎 Windows 上的 PowerPoint，Mac 上的 Keynote，一开始我就很排斥这种 PPT 的方式，需要花很多时间在排版，调字体，调颜色，做动画上面。

而现在有了 Markdown，再加上 revealjs，可以十分钟就完成一个超酷的 PPT。

简直好用到爆，而且配置非常灵活，又是一款效率利器。

项目地址： [Sildes](https://github.com/mjd507/Sildes)

有没有想立即尝试的冲动？


