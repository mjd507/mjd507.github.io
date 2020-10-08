---
title: Android Studio 插件
categories: Java & Android
toc: true
comments: true
date: 2017-03-04 19:13:24
tags:
---

今天在 Medium 上看到一个自动生成 内部 Builder 模式 的插件，感觉用到时能节约不少时间，在这里记录一下，顺便整理一下 Android Studio 上常用的插件。推荐一个网址：https://plugins.jetbrains.com/androidstudio ，大部分 AS 的插件都可以在里面找到。

<!--more-->

## [innerbuilder](http://plugins.jetbrains.com/plugin/7354)

自动生成内部 Builder 模式的插件。

[查看效果图](/images/plugins/innerBuilder.gif)



## [Android Parcelable code generator](https://plugins.jetbrains.com/plugin/7332-android-parcelable-code-generator)

自动生成 Parcelable 序列化代码的插件。

[查看效果图](/images/plugins/Parcelable.gif) 



## [Android Drawable Importer](https://plugins.jetbrains.com/plugin/7658-android-drawable-importer) 

资源图片文件的快速导入插件。

- Batch Drawable Import （很有用），假设你只有一个目录分辨率的图片，插件会自动生成你需要的其他密度目录下的图片。[查看效果图](/images/plugins/BatchDrawableImport.gif)
- Icon Pack Drawable Importer （不常用），导入的是已经预置好的一些图片。
- Vector Drawable Importer （不常用），主要实现一些分辨率无关的矢量图。
- Multisource-Drawable ，可以方便地将不同分辨率的图片放在不同的目录下。



## [ Android ButterKnife Zelezny ](https://plugins.jetbrains.com/plugin/7369-android-butterknife-zelezny)

ButterKnife 为我们省去了 findViewById 的烦恼，但是仍然需要手动地 去用 view 的 id 注释每个字段，这也是比较痛苦的，而 Android ButterKnife Zelezny 这个插件就可以再次为我们省去不少烦恼。

[查看效果图](/images/plugins/ButterKnifeZelezny.gif)

鼠标需要放在布局文件上，才会出现 generate 注入的选项。

默认变量是以布局 id 命名的，如果需要以 m 打头，需要在 Settings —> Other Settings —> Android ButterKnife Zelezny 里，Prefix for generated members 一栏中 填写字母 m。

补充：更改 Java 代码成员变量命名，在 Setting —> Editor —> Java —> Code Generation ，将 Filed 的 Name prefix 添加一个字母 m。



## Live Templates

Android Studio 预置了一些模板代码，比如 foreach，Toast，StartActivity 等，我们也可以在里面自定义一些模板代码。

[查看演示](/images/plugins/Templates.gif)



