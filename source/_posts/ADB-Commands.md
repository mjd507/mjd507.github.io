---
title: ADB 常见命令
categories: Android
toc: false
comments: true
date: 2016-12-10 20:44:37
tags:
---

Mac 下的 iTerm 终端真是炫酷到爆，而且超级好用，在调试 Android 应用的时候，在终端下使用一些 ADB 命令，能帮助我们提高不少效率，下面就整理常见的一些 ADB 操作。


<!--more-->
------

**adb 开启 / 关闭**  一般 adb 挂掉时，可以用下面第一句重新开启

  ```java
  adb start-server
  adb kill-server
  ```
------

**adb 查看设备/指定设备**

  ```java
  //列出设备的序列号
  adb devices 
    
  List of devices attached
  8eeeadda	device

  //挂载到指定设备
  adb -s 8eeeadda shell 

  ```
------

**adb 安装/卸载 apk**

  ```java
  //如果不是当前目录，则文件前要跟路径名
  adb install hello.apk 
  //安装时，保留原有数据
  adb install -r hello.apk 
    
  //直接卸载
  adb uninstall com.clear.hello 
  //卸载，但是保留数据
  adb uninstall -k com.clear.hello 

  ```
------

**adb 截图并发送到电脑**

  ```java
  //保存到SDCard
  adb shell /system/bin/screencap -p /sdcard/screenshot.png

  //保存到电脑指定目录
  adb pull /sdcard/screenshot.png /Users/mjd/Downloads/screenshot.png

  //删除手机截图
  adb shell rm /sdcard/screenshot.png

  ```
------

**adb 包管理 & 清除应用数据**

  ```java
  //列出所有应用包名
  adb shell pm list packages

  //列出系统应用包名
  adb shell pm list packages -s

  //列出第三方应用
  adb shell pm list packages -3  
    
  //列出包含指定名称的包名
  adb shell pm list packages qq
  or
  adb shell pm list packages | grep qq

  //清除 hello 应用的数据和缓存
  adb shell pm clear com.clear.hello 

  ```
------

**adb 查看前台 Activity，正在运行的 Service**

  ```java
  //前台 Activity
  adb shell dumpsys activity activities | grep mFocusedActivity
  or
  adb shell dumpsys window | grep mCurrentFocus

  //正在运行的 Service
  adb shell dumpsys activity services
  ```
------

**adb 启动 Activity ，启动 Service，发送 Broadcast**

  ```java
  //启动 微信 Activity
  adb shell am start -n com.tencent.mm/.ui.LauncherUI
    
  //启动 微信 某 Service
  adb shell am startservice -n com.tencent.mm/.plugin.accountsync.model.AccountAuthenticatorService
    
  //向所有组件发送 重启广播 
  adb shell am broadcast -a android.intent.action.BOOT_COMPLETED
  //向 com.clear.hello.BootCompletedReceiver 发送重启广播
  adb shell am broadcast -a android.intent.action.BOOT_COMPLETED -n com.clear.hello/.BootCompletedReceiver

  ```
------

**adb 查看 app 内存占用**

  ```java
  // 应用程序内存使用
  adb shell dumpsys meminfo <package_name>

  // 内存的耗用情况有四种不同的表现形式
  adb shell procrank | grep <package_name>

  ```
------

**adb 查看进程占用**

  ```java
  // 进程占用 cpu 大小
  adb shell top -n 1 -d 0.5 | grep PID

  // 进程占用 cpu 百分比
  adb shell dumpsys cpuinfo | grep <package_name>

  ```

  ​
## 参考文章
[awesome-adb](https://github.com/mzlogin/awesome-adb)


