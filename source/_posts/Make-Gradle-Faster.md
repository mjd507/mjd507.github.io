---
title: 提高 Gradle 速度的方法
categories: Big-Back-End
toc: true
comments: true
date: 2017-03-15 15:44:11
tags:
copyright: false
---

本文参考自 [How I save 5h/week on Gradle builds](https://android.jlelse.eu/speeding-up-gradle-builds-619c442113cb#.3j8ijcjq8)，由于在项目中经常碰到 Gradle build 很久的情况，所以这里把 Gradle 能优化的地方列了出来，请对照修改。

<!--more-->

## Gradle Daemon
为 Gradle 使用守护进程来构建项目，可以减少 Gradle 的启动时间。
> org.gradle.daemon=true

## Parallel Project Execution
如果你的项目有多个子 module 的依赖，设置并行执行这一项会让项目运行时间显著提升。
> org.gradle.parallel=true


## Configure projects on demand
Gradle 在执行之前，不管 项目是否需要构建，都会执行构建每一个项目的任务。
「Configuration on demand」这种模式 改变了这个行为，只会为需要的项目进行构建。和并行模式一样，按需配置对于多模块依赖的项目构建有显著的影响。


## Global gradle.properties
Mac Os 的全局设置的位置
> /Users/「username」／.gradle/gradle.properties （若没有这个文件，请先创建）。

配置内容如下：
```html
# The Gradle daemon aims to improve the startup and execution time of Gradle.
# When set to true the Gradle daemon is to run the build.
org.gradle.daemon=true

# Specifies the JVM arguments used for the daemon process.
# The setting is particularly useful for tweaking memory settings.
# Default value: -Xmx10248m -XX:MaxPermSize=256m
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8

# When configured, Gradle will run in incubating parallel mode.
# This option should only be used with decoupled projects. More details, visit
# http://www.gradle.org/docs/current/userguide/multi_project_builds.html#sec:decoupled_projects
org.gradle.parallel=true

# Enables new incubating mode that makes Gradle selective when configuring projects.
# Only relevant projects are configured which results in faster builds for large multi-projects.
# http://www.gradle.org/docs/current/userguide/multi_project_builds.html#sec:configuration_on_demand
org.gradle.configureondemand=true
```

## 使用 profile tool 来收集报告
如果想要找出哪部分构建时间过长，可以通过收集构建的信息来分析。具体的方法是：在 Gradle 的任务栈中添加「--profile」标记，如下图：
![gradle build profile config](https://user-images.githubusercontent.com/8939151/111024938-41092080-841c-11eb-93c2-eb3d5f0be48f.png)
添加成功后，在 build 后会在根目录的 「build/reports/profile」目录下看到一个 html 文件，像下面这样：
![gradle build profile](https://user-images.githubusercontent.com/8939151/111024953-4e260f80-841c-11eb-87b3-c8bc8b6c1075.png)
根据这个报告，可以一步一步优化 build 的时间。
比如：每次 Gradle 时，不再去进行 lint 检查，需要在根目录的 build.gradle 里面添加下面这句：
```java
tasks.whenTaskAdded { task ->
    if (task.name.equals("lint")) {
        task.enabled = false
    }
}
```

## 总结
- 使用全局的 gradle.properties，让每个项目内置这样的配置
- 使用 gradle 构建时，收集 profile 
- 根据 profile 选择基本的模块依赖
- 跳过不必要的 gradle task

