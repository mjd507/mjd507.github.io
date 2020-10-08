---
title: redis 基准测试和监控
categories: Back-End
toc: true
comments: true
copyright: true
visible: true
date: 2020-07-04 12:33:13
tags:
---

记录一下 redis 基准测试和监控搭建过程。

<!--more-->

## 基准测试

redis 提供了基准测试工具 redis-benchmark。

**测试机器配置：Mac OS 4c16g 256G**

```
// 默认模拟 10w 次请求，50个client并发，数据大小 3b. keep-alive 1 
~ redis-benchmark
​
// Quiet. Just show query/sec values
~ redis-benchmark -q 
PING_INLINE: 80971.66 requests per second
PING_BULK: 85106.38 requests per second
SET: 93196.65 requests per second
GET: 99403.58 requests per second
INCR: 101729.40 requests per second
LPUSH: 95693.78 requests per second
RPUSH: 81234.77 requests per second
LPOP: 87108.02 requests per second
RPOP: 84033.61 requests per second
SADD: 84889.65 requests per second
HSET: 81300.81 requests per second
SPOP: 84104.29 requests per second
LPUSH (needed to benchmark LRANGE): 81037.28 requests per second
LRANGE_100 (first 100 elements): 21920.21 requests per second
LRANGE_300 (first 300 elements): 9130.75 requests per second
LRANGE_500 (first 450 elements): 5879.93 requests per second
LRANGE_600 (first 600 elements): 4888.30 requests per second
MSET (10 keys): 64683.05 requests per second
```

## 监控

**使用 redis-exporter 上报 prometheus，接入 grafana 显示。**

1. 下载 redis-exporter ，本地 build 并且启动。

  ```
  git clone https://github.com/oliver006/redis_exporter.git
  ​
  cd redis_exporter
  ​
  go build .
  ​
  ./redis_exporter --version
  ​
  // 启动后，浏览器访问 http://localhost:9121/metrics ，有数据表示启动成功
  ```

2. 安装 prometheus

  ```
  // 下载地址: https://prometheus.io/docs/prometheus/latest/installation/
  ​
  // 解压后，cd prometheus-2.19.2.darwin-amd64, 配置 prometheus.yml 文件
  // 在 scrape_configs 下，添加 redis-exporter 配置
    - job_name: 'redis_exporter'
  ​
      # metrics_path defaults to '/metrics'
      # scheme defaults to 'http'.
  ​
      static_configs:
      - targets: ['localhost:9121']
  ​
  // 启动 prometheus.
  // ./prometheus --config.file=prometheus.yml
  // 浏览器访问 http://localhost:9090 有页面表示启动成功
  ```

3. 安装 grafana

  ```
  // 下载地址: https://grafana.com/get
  brew update
  brew install grafana
  ​
  // 启动 grafana
  grafana-server --config=/usr/local/etc/grafana/grafana.ini --homepath /usr/local/share/grafana --packaging=brew cfg:default.paths.logs=/usr/local/var/log/grafana cfg:default.paths.data=/usr/local/var/lib/grafana cfg:default.paths.plugins=/usr/local/var/lib/grafana/plugins
  ​
  // 浏览器访问 http://localhost:3000 有页面表示启动成功。用户密码都是 admin
  ​
  // grafana 页面导入 redis_exporter 仪表盘插件  https://grafana.com/grafana/dashboards/763，
  // 如提示没有 datasource，需要先创建一个 prometheus 类型的 datasource
  ​```

