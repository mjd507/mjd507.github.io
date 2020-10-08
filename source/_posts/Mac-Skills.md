---
title: Mac OS 上的一些疑问的解决方法
categories: 其他
toc: true
comments: true
date: 2016-12-01 18:42:16
tags:
---

入手 Macbook Pro 有一段时间了，基本上遇到问题，都是 Google / 百度 解决，后来遇到的次数多了，还是记不住，尤其一些对 Mac 系统操作的命令，因此决定专门抽一块土地来记录 Mac 下的经常遇到的一些操作，以便后面自己能更加快速和精准的找到答案。

<!--more-->

我的 Mac 系统的版本是 10.12.1，下面的记录都是基于此或者更高的版本。

## 常见问题

1. Mac 系统的一些快捷键
   ```java

   全屏截图              Command + Shift + 3
   区域截图              Command + Shift + 4
   窗口截图              Command + Shift + 4，再按 空格键
   默认截图是保存早桌面，不想要保存，按下 Ctrl 键保存在剪贴板中

   全屏/退出全屏        ctr+command+F
   切换到桌面           fn+f11
   输入法切换           ctr+空格       
   sublime多列操作     option+鼠标左键
   ```

2. 提示 app 打不开 / app 已损坏
   权限里需要允许  任何来源 ，默认不显示，需要在命令行输入如下语句，再次进入即可。
   ```Java
   sudo spctl --master-disable
   ```

3. 显示隐藏文件 
   ```Java
   //不显示隐藏文件
   defaults write com.apple.finder AppleShowAllFiles -bool false; KillAll Finder 
   //显示隐藏文件
   defaults write com.apple.finder AppleShowAllFiles -bool true; KillAll Finder
   ```

4. 改变 LaunchPad 上应用显示的行数和列数

   ```Java
   //设置 Launchpad 的列数，对应于每一行 App 的个数
   defaults write com.apple.dock springboard-columns -int 列数

   //2. 设置 Launchpad 的行数，对应于每一列 App 的个数
   defaults write com.apple.dock springboard-rows -int 行数

   //3. 重置 Launchpad
   defaults write com.apple.dock ResetLaunchPad -bool TRUE

   //4. 重置 Dock
   killall Dock
   ```

   ​



## 开发篇

1. 配置 git 对文件名大小敏感
   ```java
   git config core.ignorecase false
   ```



## 提升效率的干货
[提升你的 Mac 生产力 ](https://zhuanlan.zhihu.com/p/22673342)
[Mac效率利器（二）开发篇](http://kaito-kidd.com/2016/09/26/Mac-edge-tools-dev/)


