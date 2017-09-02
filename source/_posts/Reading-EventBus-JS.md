---
title: EventBus 探索 （JS）
categories: Web 前端
toc: true
comments: true
copyright: true
date: 2017-08-20 15:29:54
tags:
---

EventBus 用来管理事件的发布与订阅，在 Android 届非常有名气，可以简化系统提供的事件通信，比如 Handler， BoardCast 等。JS 里面，没有提供原生的事件管理机制的支持，但对于模块很多的页面，采用事件来管理无疑是一个很好的选择，所以，在 Github 上撸了一个 JS 版的 [EventBus](https://github.com/krasimir/EventBus) 库，源码真是精简，总共一个文件，100 行，本文就以一个小白的角度，梳理一下这个库。

<!--more-->

## 场景

当一个页面中，有多个模块，就比如这个博客页面，每个菜单按钮都对应于一个模块，传统的做法，在按钮的点击事件里，处理各个模块的逻辑，同时或许还要处理其他模块的显示隐藏清空等逻辑。

```javascript
menu.about.click = function() {
  aboutArea.loadAboutData("about date");
  homeArea.hiddenData("home data");
  archivesArea.hiddenDate("archives data");
  ......
}
```

如果页面模块不多，这样做完全是 ok 的，但假使要增加一个模块，就需要在上面的方法里额外在增加一些判断逻辑代码，这样有一个缺点，就是代码耦合比较紧，而使用事件就可以解决这个问题，点击菜单的时候，发送一个唯一的事件，在监听这个事件的方法里，实现对事件的处理。

```javascript
menu.about.dispatch("aboutBtnClicked");
aboutArea.addEventListener("aboutBtnClicked", function() {
	// update code here
});
homeArea.addEventListener("aboutBtnClicked", function() {
	// update code here
});
...
```

可以看到，点击菜单按钮，不做任何逻辑，仅仅是发送了一个事件通知，具体的业务逻辑交由页面各个模块自己处理。只需要知道是哪个事件即可。

## 特性

Eventbus 库非常精简，它仅有以下 5 个方法。

- addEventListener(type, callback, scope)   — 添加一个事件监听
- removeEventListener(type, callback, scope)  — 移除一个事件监听
- dispatch(type, target)  — 发布一个事件
- getEvents()  — 调试使用，仅仅打印添加的监听
- hasEventListener()  — 判断是否有事件监听

## 例子

假使现在一个页面有三个 tab，点击每一个 tab 切换一个页面，用事件通知来处理 tab 切换。

![](/images/eventbus-example-1.png)

1. 定义事件类型 & 事件监听器

   ```javascript
     onLoad() {
       eventbus.addEventListener('clickTab_1', clickTab_1, this);
       eventbus.addEventListener('clickTab_2', clickTab_2, this);
       eventbus.addEventListener('clickTab_3', clickTab_3, this);

       function clickTab_1(event) {
         console.log('type=' + event.type);
         this.showTab1 = true;
         this.showTab2 = false;
         this.showTab3 = false;
       };

       function clickTab_2(event) {
         console.log('type=' + event.type);
         this.showTab1 = false;
         this.showTab2 = true;
         this.showTab3 = false;
       };

       function clickTab_3(event) {
         console.log('type=' + event.type);
         this.showTab1 = false;
         this.showTab2 = false;
         this.showTab3 = true;
       };
     };
   ```

2. 点击时发送事件

   ```javascript
   clickTab(index) {
     const tabIndex = index - 0;
     if (tabIndex === 1) {
       eventbus.dispatch('clickTab_1');
     } else if (tabIndex === 2) {
       eventbus.dispatch('clickTab_2');
     } else if (tabIndex === 3) {
       eventbus.dispatch('clickTab_3');
     }
   },
   ```

## 对象传递

上面的例子中，eventbus.dispatch('eventName') 方法仅仅是发送了一个事件类型，看下源码，dispatch 可以接受两个参数，第一个事件类型，第二个就是当前对象，也就是说，dispatch 可以传递对象，这样一来，页面即使有很多对象，引用起来也很方便了。

需要注意的是，当想要获取到对象的属性时，eventbus.addEventListener(type, callback, scope) 方法一定要传 scope 参数，给个 this，表示当前类的作用域。

每个监听器的回调函数里面都接受一个 event 对象，包含两个属性：

- type  — 发布事件的名称
- target — dispatch 对象（如果有）

## 多参数传递

EventBus 支持传递多参数，在 dispatch( type, target) 方法中，如果方法传入超过 2 个参数，2个之后的都作为参数，在 addEventListener() 的回调方法中，可以获取到。

```javascript
EventBus.dispatch("custom_event", this, "javascript events", " are really useful");

EventBus.addEventListener("custom_event", callback, this);
function callback(event, param1, param2) {
  console.log("type=" + event.type); //custom_event
  console.log("params=" + param1 + param2); //javascript events are really useful
}
```

EventBus 所有的功能基本就是以上这些，建议大家去读一下源码，了解开源者的设计思想。

