---
title: HongKong Bank Money Transfer
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2026-02-16 10:43:20
tags:
---


香港，银行间转账场景。HKITL (Hong Kong Interbank Clearing Limited)  提供了两种清结算方式。CHATS 和 FPS。


<!--more-->

- CHATS (Clearing House Automated Transfer System) 

  实时全额结算系统。主要服务大额，银行同业及企业支付。仅银行工作日运行。支持 HKD，USD，EUR，CNY。

- FPS (Faster Payment System)

  FPS 即时跨行支付系统。支持所有银行和电子钱包（AlipayHK, WeChat Pay HK）, 7*24 运行。偏向零售即时支付。支持 HKD，CNY。

## 行内转账

![hsb-hsb](https://github.com/user-attachments/assets/e6804e9f-8f5a-4789-9a33-5c05d7eaf1a9)

同一家银行间的转账，无需 CHATS 和 FPS 系统介入。


## 跨行转账

![hsb-bea](https://github.com/user-attachments/assets/98bc3427-1dec-40d9-a9e2-91c8128e3764)

## 跨境转账（人民币）

![ewb-bea](https://github.com/user-attachments/assets/a39e60d0-d8ec-46c2-9ef4-b1070a447a84)

跨境转账，资金通过 swift 网络进入香港，美元的话一般走汇丰银行作为中间行，由汇丰在转入香港本地其他行。


...
