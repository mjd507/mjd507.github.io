---
title: 一款提高开发效率的插件
categories: Big-Front-End
toc: false
comments: true
copyright: true
date: 2017-10-03 19:29:58
tags:
---

Sublime 是个非常好用的编辑器，而且，我是 Sublime 的忠实用户，不仅因为它本身的轻量，还有它对各种编程语言的支持，以及丰富的插件库资源。这几天对它上瘾了，有时用来写写 Java ，有时写写 js，有时写写 Python，卧槽，这编辑器强大得深不可测。

<!--more-->

在读一些源代码的过程中，相信大家都会遇到这样一个问题：这个单词什么意思啊？每当这时，就会打开浏览器，搜索翻译词典，输入要翻译的词，然后在回到编辑器的代码中。出于对 Sublime 的热爱，这次国庆花了一天时间写了一个翻译插件，从此你阅读代码的是下面这个样子了。

![翻译源码](https://user-images.githubusercontent.com/8939151/111024385-7fe9a700-8419-11eb-890b-b17406f3c00b.png)

在需要翻译的单词上，按下 `alt + t` 就会显示翻译结果了，瞬间省了不少时间。



下面这个功能就更能提高效率了，在写代码过程中，我们经常在起名称上花费不少时间，像变量名，方法名，类名...... 每当这时，如果不知道对应的英文，还是得打开浏览器，搜索翻译词典，输入要翻译的词，然后在回到编辑器写上名称，确实繁琐，而现在，你需要按下 `alt + i` 即可打开 sublime 的输入面板，在这里输入要翻译的单词，按下回车，就好出现翻译的文本了。

![输入要翻译的单词](https://user-images.githubusercontent.com/8939151/111024325-2c775900-8419-11eb-9510-dc75de063937.png)

按下回车，即可翻译输入的单词，中英文翻译可自动识别哦。

![翻译结果](https://user-images.githubusercontent.com/8939151/111024376-6f393100-8419-11eb-81f8-0fbca3f8bb88.png)

对于这个功能，个人认为非常方便，所以也提交到 Sublime 的 [package_control_channel](https://github.com/wbond/package_control_channel) 中去了，现在已通过了测试，预计过几天大家就能在安装面板搜索到了，如果插件提供的快捷键与你之前的插件有冲突，也可以采用右击菜单的方式，使用该翻译的功能。

插件的仓库地址：[Translate-CN](https://github.com/mjd507/Sublime-Translate)，使用 [有道智云](http://ai.youdao.com/docs/doc-trans-api.s#p02) 提供的翻译 api 实现。

**Tips:** 

- 有道智云的翻译服务是收费服务，具体收费可参加其[文档](http://ai.youdao.com/docs/doc-trans-price.s#p03)
- 建议自己注册一个账号，获取 appKey 和 secretKey，将代码里的对应的 appKey 和 secretKey 换成自己的。（按一个单词 10 个字符来算，新人可免费翻译近 21 万个单词，一天翻译 100 个，可以免费用近 6 年鸟~）
- 更多详情内容可移步以上 Github 仓库地址。