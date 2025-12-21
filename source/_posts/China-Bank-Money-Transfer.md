---
title: China Bank Money Transfer
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2025-12-21 16:50:37
tags:
---

中国，银行间转账场景。

<!--more-->


## 行内转账

![ICBC-ICBC](https://github.com/user-attachments/assets/2e6a773f-7392-44c5-a412-c851074a3a4f)

同一家银行间的转账，不区分同城或异地，都属于行内转账，无需第三方清算系统介入。


## 跨行转账

![ICBC-CCB](https://github.com/user-attachments/assets/280dd645-3af3-41bb-859f-db1524763e41)

中国的银行跨行转账，都必须接入中国人民银行（央行）系统，来进行清结算。

央行的清结算系统（**CNAPS**）提供了三种清结算方式：

1. **HVPS**：大额实时支付系统，如企业大额对公付款、银行间资金调拨、证券交易清算、个人大额跨行转账。
2. **BEPS**：小额批量支付系统，如代发工资、水电费代扣、养老金发放、信用卡自动还款。
3. **IBPS**：网上支付跨行清算系统，如个人网银 / 手机银行跨行转账。

各家银行在央行都开通了准备金账户，央行收到支付指令后，在双方银行的准备金账户进行划拨。

对于第三方支付机构，如支付宝，微信，2018 年起不得直连银行，必须通过 **网联 / 银联**，与底层央行清算对接。


## 跨境转账（人民币）

![ICBC-UOB](https://github.com/user-attachments/assets/cff5d78e-23ec-4029-b160-f6a02c1c169a)

**CIPS** 是人民币跨境支付系统，专门处理人民币跨境支付业务的实时清算系统，避免 对 SWIFT 网络的依赖。


## 报文格式

### IBPS，实时转账报文

```xml
<Document>
  <IBPS>
    <!-- 报文头 -->
    <Header>
      <MsgType>TR001</MsgType> <!-- 报文类型：TR001=实时贷记转账 -->
      <MsgId>IBPS20250520153045001</MsgId> <!-- 超级网银唯一报文ID -->
      <SenderInst>102290000012</SenderInst> <!-- 发起行行号 -->
      <ReceiverInst>103100000023</ReceiverInst> <!-- 接收行行号 -->
      <SendTime>2025-05-20T15:30:45</SendTime> <!-- 发送时间 -->
    </Header>
    <!-- 报文体 -->
    <Body>
      <TransType>INTER_BANK_REAL_TIME</TransType> <!-- 实时跨行转账 -->
      <Payer>
        <AccountNo>622609********1234</AccountNo>
        <AccountName>张三</AccountName>
        <BankName>中国建设银行上海闵行支行</BankName>
      </Payer>
      <Payee>
        <AccountNo>622208********5678</AccountNo>
        <AccountName>李四</AccountName>
        <BankName>中国工商银行北京朝阳支行</BankName>
      </Payee>
      <TransAmount>1000.00</TransAmount>
      <TransPurpose>个人实时转账</TransPurpose>
      <SettleFlag>REAL_TIME</SettleFlag> <!-- 实时结算 -->
    </Body>
    <!-- 报文尾 -->
    <Signature>
      <CertId>123456</CertId> <!-- 证书编号 -->
      <SignValue>MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBA...</SignValue> <!-- 签名值 -->
    </Signature>
  </IBPS>
</Document>
```

### 网联第三方支付跨行转账

```json
{
  "msgHead": {
    "msgType": "TRANSFER_REQUEST",  // 报文类型：转账请求
    "msgId": "WL20250520153045001", // 网联唯一报文ID
    "sendInst": "ALIPAY",           // 发送机构：支付宝
    "recvInst": "WLCC",             // 接收机构：网联清算中心
    "sendTime": "2025-05-20 15:30:45" // 发送时间
  },
  "msgBody": {
    "transType": "INTER_BANK",      // 交易类型：跨行转账
    "payerInfo": {
      "payerBankCode": "CMB",       // 付款行代码：招商银行
      "payerAccountNo": "622588********1234", // 付款人账号
      "payerName": "张三"           // 付款人姓名
    },
    "payeeInfo": {
      "payeeBankCode": "ICBC",      // 收款行代码：工商银行
      "payeeAccountNo": "622208********5678", // 收款人账号
      "payeeName": "李四"           // 收款人姓名
    },
    "transAmount": "1000.00",       // 交易金额
    "transCurrency": "CNY",         // 交易币种：人民币
    "nettingType": "REAL_TIME",     // 轧差类型：实时轧差
    "settleChannel": "IBPS"         // 结算通道：超级网银
  },
  "msgTail": {
    "sign": "E5F6G7H8...",          // 数字签名
    "checkSum": "1A2B3C4D..."       // 校验和
  }
}
```


