---
title: Mac OS 上的一些疑问的解决方法
categories: Mac
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
   ```

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

## 开发篇

1. 配置 git 对文件名大小敏感
   ```java
   git config core.ignorecase false
   ```



## 提升效率的干货
[提升你的 Mac 生产力 ](https://zhuanlan.zhihu.com/p/22673342)
[Mac效率利器（二）开发篇](http://kaito-kidd.com/2016/09/26/Mac-edge-tools-dev/)


<br /><br /><br />

<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/"><img alt="知识共享许可协议" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-nd/3.0/cn/88x31.png" /></a><br />本作品采用<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/">知识共享署名-非商业性使用-禁止演绎 3.0 中国大陆许可协议</a>进行许可。