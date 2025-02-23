---
title: SSH 使用以及与 HTTPS 的对比
categories: Big-Back-End
toc: false
comments: true
copyright: true
date: 2018-02-08 21:29:47
tags:
---

HTTPS 与 SSH，他们都是网络通信的协议，主要作用都是加密网络通信数据，他们之间的区别广义上讲，差不了多少，以至于有人把他们比作 [苹果和桔子](https://security.stackexchange.com/questions/1599/what-is-the-difference-between-ssl-vs-ssh-which-is-more-secure)的关系，我们日常使用的 GitHub，在 clone 仓库的时候，也提供了 HTTPS 和 SSH 两种方式，都能 clone 下来。

但 SSH 和 HTTPS 还是不同的，HTTPS 大量用于客户端服务器直接的安全通信，SSH 主要用于两台电脑之间登录、共享数据和协同工作。

<!--more-->

|      |     SSL（HTTPS）      |          SSH          |
| :--: | :-----------------: | :-------------------: |
|  全称  | Secure Socket Layer |     Secure Shell      |
| 端口号  |         443         |          22           |
|  应用  |    客户端服务器之间的加密通信    |      两台电脑之间的加密通信      |
|  授权  |        公钥和私钥        | 1. 公钥和私钥 \n  2.用户名和密码 |

之前已经整理过 HTTPS 相关的知识，这里主要记录一下 SSH 相关知识。

## 1. SSH 口令登录

现在我在阿里云购买了一台云服务器，其 ip 地址为 120.27.210.94，我在自己电脑上，用 SSH 登录远程主机。

```
➜  ~ ssh root@120.27.210.94
The authenticity of host '120.27.210.94 (120.27.210.94)' can't be established.
ECDSA key fingerprint is SHA256:+FvnAMcSHUPuWvciMpQhvlZaITKUg9gJa/nqAyg7G/s.
Are you sure you want to continue connecting (yes/no)?
```

ssh 默认的端口号为 22，如果远程主机 ssh 端口号不是 22，比如是 27037，那么就这样指定 `ssh -p 27037 root@120.27.210.94`

由于是第一次登录，为了防止中间人攻击，远程主机显示了自己的公钥指纹，确认没问题后，输入确认建立连接。

```
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added '120.27.210.94' (ECDSA) to the list of known hosts.
root@120.27.210.94's password:
...
Welcome to Alibaba Cloud Elastic Compute Service !
```

当远程主机的公钥被接受以后，它就会被保存在文件$HOME/.ssh/known_hosts之中。下次再连接这台主机，系统就会认出它的公钥已经保存在本地了，从而跳过警告部分，直接提示输入密码。



## 2. SSH 公钥登录

每次都输入密码，很麻烦，SSH 也提供了公钥登录，原理就是，本地主机生成一个公钥和私钥，并将公钥在远程主机上存储一份。登录的时候，远程主机会向本地主机发送一个随机字符串，本地主机用生成的私钥加密后，发送给远程主机。远程主机采用公钥进行解密，如果匹配，则登录成功，不需要输入密码。

### 2.1 原理图

![图片来自(https://www.git-tower.com/learn/git/ebook/cn/command-line/advanced-topics/ssh-public-keys)](https://user-images.githubusercontent.com/8939151/111024408-9ee83900-8419-11eb-86a3-36cde5a1358e.png)

### 2.2 本地生成公钥私钥

```
➜  ~ ssh-keygen
Generating public/private rsa key pair.
Enter file in which to save the key (/Users/mjd/.ssh/id_rsa):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /Users/mjd/.ssh/id_rsa.
Your public key has been saved in /Users/mjd/.ssh/id_rsa.pub.
The key fingerprint is:
SHA256:eioQgRNeYDEoGXJ6tXY6uonHPUxT8PhE9KjJmC7GAgY mjd@mjddeMacBook-Pro.local
The key's randomart image is:
+---[RSA 2048]----+
|=X+....          |
|Xo+....o         |
|Eo..o=o .        |
|...=.=+          |
|..o.*+  S        |
|+...o...         |
|o+o= .. .        |
|oooo=  o         |
|..o  o.          |
+----[SHA256]-----+
```

现在，两个密钥文件被创建出来了：「id_rsa.pub」(公钥) 和 「id_rsa」(私钥)。如果是 Mac，可以在你 home 目录下的「.ssh」 目录中找到它们（~./ssh/）。

### 2.3 将公钥放到远程主机

现在把生成的公钥「id_rsa.pub」放在远程主机上，使用 ssh-copy-id user@host 命令。

```
➜  ~ ssh-copy-id root@120.27.210.94
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/Users/mjd/.ssh/id_rsa.pub"
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
root@120.27.210.94's password:

Number of key(s) added:        1

Now try logging into the machine, with:   "ssh 'root@120.27.210.94'"
and check to make sure that only the key(s) you wanted were added.
```

PS: 如果远程主机 ssh 端口号不是默认的 22，比如说是 27037，那么就应该这样指定 `ssh-copy-id root@120.27.210.94 -p 27037`

好了，现在本地公钥就在远程主机上安装完成了，再次登录远程主机，就不要在输入密码了。

```
➜  ~ ssh root@120.27.210.94
Last login: Tue Feb 13 15:02:55 2018 from 180.126.250.177

Welcome to Alibaba Cloud Elastic Compute Service !

[root@mjd-centos ~]#
```



### 2.4 authorized_keys 文件

远程主机将本地主机的公钥放在`$HOME/.ssh/authorized_keys`文件中，用 cat 命令查看下该文件内容。

```
[root@mjd-centos ~]# cat ~/.ssh/authorized_keys
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQD4g5LVz0A3q76pXrqT0CE1XP6rvJtu2aJ9rQDFqTaEXi1hnRWKMATD524AXsv9IZmA2kzWj56WETwwXY73kQt9/OhywKzMlrwTXYNu5x5tpvDImX6A9wGxeROXyHI4iAzkaqiPc8ZqtJDOHTqZRrR2E99r+c72d4GwmZwz9ZENAzYcjrgM/z1M27t24hNlD9fxLFHp6c+SO4Q0nxw0JNETUeaZLzGyxC2nolN7ROzrRrt0j0Qv528uqk2eaSVDjKi/lbwzxM3gzY/yCTQ8HWGlJy2alqw9EcKH9F4HbYyQyrTHd3Bf/g6P+eqPSK9eWTqnjl7UI+yieqbG7E3xKEoB mjd@mjddeMacBook-Pro.local
[root@mjd-centos ~]#
```

与本地公钥的内容完全一样，所以，另一种安装公钥的方式，就是直接将本地公钥的内容 copy 到 `$HOME/.ssh/authorized_keys` 这个文件中。

```
➜  ~ ssh root@120.27.210.94 'mkdir -p .ssh && cat >> .ssh/authorized_keys' < ~/.ssh/id_rsa.pub
```

这样，同样下次登录不在需要密码。



## 3. Github 的 HTTPS 与 SSH

Github 提供了 HTTPS 与 SSH 两种通信方式，查看使用的那种通信协议，可以选取一个 Git 仓库，执行 `git remote -v`。

```
➜  mjd507.github.io git:(hexo) ✗ git remote -v
origin	https://github.com/mjd507/mjd507.github.io.git (fetch)
origin	https://github.com/mjd507/mjd507.github.io.git (push)
```

可以看到我这里都是使用的 HTTPS 协议，使用 HTTPS 的特点就是每次都需要用户名和密码验证才能通信，这里我是配置了用户名和密码，所以每次操作不需要输入，但本质通信还是需要用户名密码验证。如何配置记住用户名和密码，每个操作系统还有点差别，网上资料很多，这里不多说。

这里我将仓库添加 SSH 协议进行通信。

```
➜  mjd507.github.io git:(hexo) ✗ git remote add origin-ssh  git@github.com:mjd507/mjd507.github.io.git
➜  mjd507.github.io git:(hexo) ✗ git remote -v
origin	https://github.com/mjd507/mjd507.github.io.git (fetch)
origin	https://github.com/mjd507/mjd507.github.io.git (push)
origin-ssh	git@github.com:mjd507/mjd507.github.io.git (fetch)
origin-ssh	git@github.com:mjd507/mjd507.github.io.git (push)
```

现在如果直接 push 会报没有权限，因为 github 上没有我的公钥。

```
➜  mjd507.github.io git:(hexo) ✗ git add .
➜  mjd507.github.io git:(hexo) ✗ git commit -m '添加图片说明'
....
➜  mjd507.github.io git:(hexo) ✗ git push origin-ssh hexo
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.
```

我将刚刚用 `ssh-keygen` 生成的公钥配置到 Github 上去，此时在提交，就成功了。

```
➜  mjd507.github.io git:(hexo) ✗ git push origin-ssh hexo
Counting objects: 10, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (9/9), done.
Writing objects: 100% (10/10), 1.04 KiB | 1.04 MiB/s, done.
Total 10 (delta 6), reused 0 (delta 0)
remote: Resolving deltas: 100% (6/6), completed with 6 local objects.
To github.com:mjd507/mjd507.github.io.git
   25a4d402..75c0bc7f  hexo -> hexo
```



## 参考阅读

[HTTPS (SSL) and SSH: A Conceptual Understanding](https://medium.com/@alxsanborn/https-ssl-and-ssh-a-conceptual-understanding-9-2-16-4e75ce8d574)

[[What is the difference between SSL vs SSH? Which is more secure?](https://security.stackexchange.com/questions/1599/what-is-the-difference-between-ssl-vs-ssh-which-is-more-secure)

[使用 SSH 公钥验证](https://www.git-tower.com/learn/git/ebook/cn/command-line/advanced-topics/ssh-public-keys)

[SSH原理与运用（一）：远程登录](http://www.ruanyifeng.com/blog/2011/12/ssh_remote_login.html)