---
title: 代理和信托-项目总结
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2025-08-07 18:26:39
tags:
---

总结一下项目：代理和信托(Agency and Trust)

<!--more-->

## 背景

代理和信托是一个存在很久（20年+）的项目，客户端是安装在 Windows 上一个应用程序，服务端是 c#，2020 年开始，决定迁移到更现代化的 web 系统来取代 Windows 上的程序，新项目使用微服务架构，技术栈 SpringBoot + Angular + Openshift，共用 Oracle 数据库。

原始功能非常庞大，有一定的业务壁垒，整个迁移周期也是逐渐拉长，目前已经摊开了 40+ 服务模块（前后端各 20+），规划也排到了 2028 年。

以下列举我接触到的模块，模块开发采用`充血模型`，按照 ops（运营操作人员） 的需求，一点点往里面添加。


## 债券发行(Issuance)

ops 在和 发行人，投资人等多方敲定好后，会准备一个 Excel 表格，列出要发行的债券发行号，金额，币种，发行人信息，债券类别等信息。系统根据 Excel 信息创建债券。原始的创建流程，包含了多个步骤，需要 ops 跟着 sop 一步一步操作，耗时且有一定操作错误的可能性，在新的系统上，我们设计了一个 file-mapper 模块，将债券创建的流程自动化。


### file-mapper

和 ops 预定义债券发行的模版，系统会预配置每个模版所包含的所有需要的字段，字段属性，格式，默认值等。

ops 在上传 excel 前，需要先选择模版，并基于此创建一个配置，该配置包含所有必选字段，可增删可选字段，设置字段的位置，默认值等。

ops 选择配置，并上传 excel，系统会解析并自动创建债券，提供结果页显示成功和失败的记录，方便参考和修改。

```sql

-- PREDINE TEMPLATE DATA (STATIC DATA) IN BELOW TWO TABLES.

create table FM_TEMPLATE (
  ID NUMBER AUTO_INCREMENT,
  TYPE VARCHAR(16), -- ISSUANCE CREATE/UPDATE , RATE-FIXING, CUTODY
  NAME VARCHAR(64),
  CREATED_AT DATE,
  UPDATED_AT DATE
);

create table FM_TEMPLATE_COLS (
  ID NUMBER AUTO_INCREMENT,
  TEMPLATE_ID NUMBER,
  NAME VARCHAR(32),
  TYPE VARCHAR(16),
  INDEX NUMBER,
  DFT_VAL VARCHAR(255),
  REQUIRED CHAR(1),
  FORMAT VARCHAR(64),
  CREATED_AT DATE,
  UPDATED_AT DATE
);

-- END

-- USER CREATE DATA IN BELOW TWO TABLES

create table FM_CONFIGURATION_TEMPLATE (
  ID NUMBER AUTO_INCREMENT,
  CONFIG_NAME_PREFIX VARCHAR(64),
  TEMPLATE_ID NUMBER,
  HAS_HEADER CHAR(1),
  HEADER_CNT NUMBER,
  CREATED_AT DATE,
  UPDATED_AT DATE
);


create table FM_CONFIGURATION (
  ID NUMBER AUTO_INCREMENT,
  CONFIG_TEMPLATE_ID NUMBER,
  CONFIG_NAME VARCHAR(255),
  COL_ID NUMBER,
  COL_IDX NUMBER,
  DFT_VAL VARCHAR(255),
  CREATED_AT DATE,
  UPDATED_AT DATE
);

-- END

```


### skeleton-instrument

一个金融交易的骨架，大致包含如下信息

```json
{
  "instrument_id": "FIN-INSTR-2023-0001",  // 金融工具唯一标识符
  "type": "CREDIT",  // 类型：CREDIT(信用类)/EQUITY(权益类)/DERIVATIVE(衍生类)/PAYMENT(支付类)
  "sub_type": "LETTER_OF_CREDIT",  // 子类型：如信用证、债券、汇票等
  
  "issuer": {
    "entity_id": "BANK-001",  // 发行机构ID
    "name": "Global Trade Bank",  // 发行机构名称
    "type": "BANK",  // 发行机构类型：银行、企业、政府等
    "country": "US",
    "credit_rating": "AA+"  // 发行机构信用评级
  },
  
  "counterparty": {
    "entity_id": "CLIENT-12345",  // 交易对手ID
    "name": "International Trading Co.",  // 交易对手名称
    "type": "CORPORATE",  // 类型：企业、个人等
    "country": "DE"
  },
  
  "terms": {
    "currency": "USD",  // 货币单位
    "principal_amount": 500000.00,  // 本金金额
    "issue_date": "2023-11-15",  // 发行日期
    "maturity_date": "2024-11-15",  // 到期日
    "interest_rate": {  // 利率条款（如适用）
      "type": "FIXED",  // 固定/浮动
      "value": 3.5,  // 利率值
      "basis": "ANNUAL"  // 计息基础
    },
    "payment_schedule": [  // 支付计划（如适用）
      {
        "due_date": "2024-05-15",
        "amount": 8750.00,
        "type": "INTEREST"
      },
      {
        "due_date": "2024-11-15",
        "amount": 508750.00,
        "type": "PRINCIPAL_AND_INTEREST"
      }
    ]
  },
  
  "collateral": {  // 抵押品信息（如适用）
    "type": "REAL_ESTATE",
    "description": "Commercial property in Berlin",
    "value": 750000.00,
    "valuation_date": "2023-11-01"
  },
  
  "governing_terms": {
    "law_jurisdiction": "New York, USA",  // 适用法律管辖地
    "dispute_resolution": "ARBITRATION",  // 争议解决方式
    "amendment_provisions": "REQUIRES_ALL_PARTIES"  // 修改条款
  },
  
  "status": "ACTIVE",  // 状态：DRAFT/ACTIVE/EXPIRED/CANCELLED
  "events": [  // 事件记录
    {
      "event_type": "ISSUED",
      "timestamp": "2023-11-15T10:30:00Z",
      "description": "Instrument issued by Global Trade Bank"
    }
  ]
}

```


## 账户行(Account Bank)

账户行即一家银行在另一家银行开立账户，并通过该账户进行跨境支付，清算等金融服务。

新系统对账户行迁移了两块重要内容。

1. 展示清算通知的记录（receive-queue），即以 MT910 为核心的 record，MT910 是账户行在资金接收环节中，向账户持有人传递到账信息的核心工具，是清算的通知凭证。


2. 对符合要求的账单，自动进去结算(MT103/MT202)，（工作日 9 - 6 点，每 15 mins）

```java
void autoPaymentRelease() {
  var payments = getValidatedPayments();
  for (var p : payments) {
    releasePayment(p);
    sendSwiftMessage();
  }
}
```

## 资金托管(Custody)

1. 托管账号管理 (safekeeping account)，默认从 swift message 中解析创建，也可系统创建，支持设置账号对应的客户邮箱。

2. MT537 (Pending Transactions Advice)，未完成交易通知。用于证券账户服务机构（如托管银行）向账户持有人报告所有未完成的证券交易状态（如待结算、待确认的交易）。

    当系统收到 mt537 时，

    - 解析到具体的账号，关联对应的罚款信息。
    - 按日/月生成 pdf penalty 信息
    - 将 penalty pdf 发往相应的客户

3. payment instruction flow 

  - 构建基于邮件的 payment 流程。 含盖 receive/authorise/signature/completed 等阶段。


## 跨境支付(Principe Paying Agent)

PPA 常见于国际债券发行（如欧洲债券、全球债券）或跨市场发行的债务工具中，由于持有人分布在不同国家 / 地区，需要通过 PPA 统一协调付款流程，确保跨境支付的效率和合规性。

1. payment authorise & release
2. funding authorise & release

```java
void paymentRelease() {
  try {
    releaseFunding();
  } catch(Exception ex) {

  }
  validateStatus();
  checkBalance();
  updateStatusDenomination();
  sendSwiftMessage();
}
```

## 监管审查(Sanction Screening)

1. MT series messages screening
2. ISO messages screening
3. build message Canonical model to unify screening process.

```java

void performScreening() {
  var hdr = generateXmlHeader();
  var body = generateXmlBody();
  sendToMqForScreening(new String(hdr+"\n"+body));
}

```


## swift-message

1. central entry for all kinds of incoming messages.

## maintenance 

1. payment currency cutoff time 
2. payment threshold（checker 1/2/3）

## mail-service

1. reading payment instruction emails from specified mailboxes


## payment-workflow

real payment processing for PPA/IPA/ACCOUNT-BANK


## rate-fixing


## ETL

1. spring-batch jobs for different kinds of feeds
2. spring-integration poller tasks for differnet eip flow



