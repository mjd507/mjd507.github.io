---
title: HIDS
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2021-03-21 08:27:31
tags:
---

HIDS - Host-Based Intrusion Detection System, 主机入侵检测系统。

<!--more-->

## 背景

HIDS 是 2019 年公司基于服务器安全考虑，组建了一支队伍，来防御越来越多的外部入侵事件，保障主机安全。

检测主机的 agent 需要满足高性能，资源占用少，同时具备自我熔断（不影响服务器主服务）和恢复功能，在技术栈的选择上，客户端 agent 选取了 go 作为开发语言，服务端选用 Java/spring-boot 开发。

为了高可用，agent 和 server 不直接交互，而是借助了分布式协调组件 ETCD 集群，ETCD 也是 go 语言编写，相比 zookeeper 更轻量，k8s 中也把 ETCD 作为存储配置使用。


## 配置下发

agent 有一个主进程（master），有 10 个插件进程，每个插件的运行都依赖 master 获取配置，从而可以控制 agent 的行为。

当 agent 注册到 etcd 时，会写入自己的 key：

```txt
/hids/agent/master/{hostname}
```

server 会监听到 etcd 注册的 key，同时去 db 获取当前所有插件的配置，组合成一个 json ，写到 etcd：

```txt
/hids/server/config/{hostname}
```

下发的内容格式：
```json
{
  "master": 12345, // value 为配置的 id，agent 根据此 id，在读一次 etcd，获取具体的 value。
  "plugins": {
    "file-watcher": 12346,
    "web-shell": 12347,
    "proc": 12348,
    "rasp": 12349,
    "xxx": 12350
  }
}
```

为什么下发的时候是下发 id，而不是配置的具体内容呢？

一开始确实是下发内容，但是我们有 50w+ 台主机，等同于向 etcd 写了 50w+ 个相同的 big value，对集群的延迟很大，后面我们还尝试过按每个插件写 value，等于一台主机，写 10 次 value，效果仍然不理想，虽然 value 小了，但是写的次数多了，整体总的 value size 并没有减小。

最终，我们采取了预写的方式，每次下发前，将每个插件的 value 先预写到 etcd 里，db 里保存每个 value 对应 key 的 id，真正下发，按照以上 id 的形式，给到 agent，这个就非常轻量，agent 解析完，在去 etcd 读取 相应的配置。

至此，server 全量主机的配置下发，从一开始的 6 小时到现在的 2min，etcd 的 cpu，mem 和 disk 也都趋于稳定降低的可控状态。

注意：为避免多台主服务处理同一个 agent 注册信息，我们将 6 台主服务也注册到了 etcd，并根据自己 server 的主机名 hash 取模，当监听到 agent 注册时，计算 agent 主机在 server 中的 hash 取模值，只有值相等，才会处理注册信息，确保只有一台主 server 处理注册信息。 主 server 会向 kafka 写一个 message，将 具体的配置下发交给 consumer 处理。


## ETCD 监控

考虑到日益增加的容器数量，以及集群压力，ETCD 集群节点数量由刚开始的 7 台，增加到了 9 台，每个节点 16c + 64g + 500g ssd，平摊下来每个节点连接了不到 6w 的 agent。运行一年多，暂时没有压力。

ETCD 组件本身提供了 metrics 数据输出接口，我们采用了官方推荐的 prometheus 采集数据，并使用 grafana 做聚合和图表展示。

同时接入了内部的告警系统，在 etcd cpu/mem/disk 超过配置阈值时，触发告警。

在全量配置下发的情况下，cpu 的阈值必触发告警，这也是我们迫切优化配置下发的原因，当然为了避免漏报，我们能容忍一定的告警干扰。


## 主机管理

server 端维护了所有注册主机的配置信息，包括每个插件当前的状态，是否熔断下线等。这是基于另一条心跳数据收集链路在实现的。

每台主机每 5 分钟会上报一次心跳数据，心跳日志里就包含了插件的存活状态，当前占用的 cpu/mem 等。程序写日志时，指定了心跳日志的 topic，每台主机有个 log-agent，会将日志打到对应的 kafka topic 里面，

server 端有 9 台 kafka consumer，负责消费并入库。同时会调用主机管理团队的接口，获取该主机所处的机房，组织，部门 bu 信息等。

支持按 主机/项目组/部门/产品线/机房 等维度下发特定的配置，核心流程和配置下发相同，agent 解析后会跟本身配置 id 做一个 diff ，在觉得要不要获取新配置。


## 数据对账

每个插件有自己单独的 kafka topic，在数据收集这一块，我们将 kafka 的数据，接入 elasticsearch，服务端基于 es 数据设计对账功能。部分统计功能接入 storm/flink，同时接入 redis 集群，做 top n 的主机统计。

对账有两个维度：一是同比，一是环比，并设置告警模块，告警阈值，告警规则，告警频率，告警聚合等等。

作为链路的最下游，告警曾多次帮助我们第一时间发现上游数据链路的问题。


End.



