---
title: 干货集中营--业余项目
categories: Android
toc: true
comments: true
date: 2017-02-19 16:48:14
tags:
---

最近一直在尝试着整理 Android 基础库，无意中发现了 [干货集中营的 Api](http://gank.io/api)，于是打算用自己的 基础库 来搭建一个 干货集中营的 Android 客户端，既可以检验和完善基础库，又可以实现一个项目，着实让人兴奋。这里要特别感谢一下代码家提供的 api 。该项目 [Github 地址](https://github.com/mjd507/CommonAndroid)。

<!--more-->

## 项目动图

![干货集中营](/images/gank/gank.gif)

## 大致说明

下面只会说明一下项目的整理思路，不会贴出代码的细节。项目基础库部分全部在 Common 文件夹下，包括网络请求的 HttpTask，返回的结果 HttpResponse，以及 JsonUtils 数据处理类等，这部分因为适用于绝大多数项目，所以一般不会动，应用层 全部在 com.cleaner.gank 包下面。

## 数据架构

应用层以模块分包，每日信息一个包，各中类别的信息一个包，数据详细一个包，搜索一个包（该功能没做），每个包里面都是使用 MVP 的架构模式。

V 层有一个接口，包含一些 UI 更新的提示，比如 显示加载框，隐藏加载框，获取数据成功，获取失败（失败类型：数据错误，网络错误...）等

M 层包含了 数据实体（Javabeen）；数据提供者，分两个，一个是从网络获取，一个是从本地获取；数据回调接口。

P 层构造时，创建出 M 层的数据提供者，并且通过实现 V 层的接口，将 M 层的数据回调给 V 层。

这样我们的 Activity/Fragment 就很简单了，只有实现 V 的接口，处理 UI 就可以了。


该项目中会有一个全局的广播接受者，检测网络状态；从网络加载数据也会在本地缓存一份，当数据加载失败是由于没有网络时，M 层数据提供者会从 本地获取数据。


## UI 部分

采用了 Material Design 的风格，主页使用 DrawerLayout + CoordinatorLayout + NavigationView 完成。
其中 CoordinatorLayout 包含 AppBarLayout（Toolbar + TabLayout）+ ViewPager 完成。
NavigationView 直接在 menu 下配置了几个 item。

ViewPager 里面嵌套了 Fragment，Fragment 的布局使用 SwipeRefreshLayout + RecyclerView 来完成数据加载的动画 和数据显示的 布局。


## 技术说明

ViewPager 默认会加载左右两个 Fragment，这里就需要使用 懒加载，具体可看项目的 BaseFragment 以及它的实现类 BaseTagFragment。

主题换肤 是本地实现的，预先定义了四种主题颜色，根据本地配置去加载相应的布局，实现更改也是通过代码设定布局的属性来实现的。这里使用的是 [hehonghui/Colorful](https://github.com/hehonghui/Colorful)开源的主题换肤。


## 福利
![](/images/gank/beauty_one.png)!

<br /><br /><br />

<center>
<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/"><img alt="知识共享许可协议" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-nd/3.0/cn/88x31.png" /></a><br />
本作品采用 <a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/">知识共享署名-非商业性使用-禁止演绎 3.0 中国大陆许可协议</a> 进行许可。
</center>
