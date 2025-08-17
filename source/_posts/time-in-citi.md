---
title: Agency and Trust
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2025-08-07 18:26:39
tags:
---

总结一下项目：代理和信托。

代理涵盖帮助投资机构/投资者买卖证券，收益归投资者。

信托涵盖财富管理，收益归约定的受益人。

<!--more-->

## 背景

代理和信托是一个存在很久（20年+）的项目，客户端是安装在 Windows 上一个应用程序，服务端是 c#，2020 年开始，决定迁移到更现代化的 web 系统来取代 Windows 上的程序，新项目使用微服务架构，技术栈 SpringBoot + Angular + Jenkins + Openshift，共用 Oracle 数据库。所有功能都包含 maker-checker 以及 audit-trail 等审计流程。

原始功能非常庞大，有一定的业务壁垒，整个迁移周期也是逐渐拉长，目前已经摊开了 40+ 服务模块（前后端各 20+），规划也排到了 2028 年。

以下列举我接触到的模块，模块开发采用`充血模型`，按照 ops（运营操作人员） 的需求，一点点往里面添加。


## 债券发行(Issuance)

目前是在一级市场进行发债，ops 在和 发行人，投资人等多方敲定好后，会准备一个 Excel 表格，列出要发行的债券发行号，金额，币种，发行人信息，债券类别等信息。系统根据 Excel 信息创建债券。
### main tables

```sql
create table c_issuer ( -- 发行主体信息表
  ID NUMBER AUTO_INCREMENT,
  issuer_name VARCHAR(32),
  issuer_type VARCHAR(32),
  client_id NUMBER, -- 关联主体实体表 (client_contact)
  inst_id NUMBER, -- 关联债券主表 c_instrument
  CREATED_AT DATE,
  UPDATED_AT DATE
);
```

```sql
create table c_instrument ( -- 债券基本信息表
  ID NUMBER AUTO_INCREMENT,
  isin_code VARCHAR(16), -- 债券代码
  isin_name VARCHAR(32),
  isin_type VARCHAR(10), -- 国债、企业债、公司债、短融等
  issue_scale DECIMAL, -- 发行面额规模
  interest_type VARCHAR(16), -- 计息方式（固定利率、浮动利率等）
  coupon_rate DECIMAL, -- 票面利率（年化，%）
  issue_start_date DATE,
  issue_end_date DATE,
  maturity_date DATE,
  issue_status VARCHAR(16),
  CREATED_AT DATE,
  UPDATED_AT DATE
);
```

```sql
create table a_event ( -- 债券发行方案表，1 instrument - n event
  ID NUMBER AUTO_INCREMENT,
  inst_id NUMBER, -- 关联债券主表 c_instrument
  currency VARCHAR(4),
  evt_type VARCHAR(16),
  initial_balance DECIMAL,
  conf_bal DECIMAL,
  unconf_bal DECIMAL,
  value_dt DATE,
  usd_currency VARCHAR(4),
  status VARCHAR(16),
  CREATED_AT DATE,
  UPDATED_AT DATE
);
```

发行完成后，理论上有一个认购流程，但是我涉及到的系统并没有涉及到认购流程，猜测发债采取的非公开发行的方式（私募债），仅面向合格机构投资者，认购门槛高（如单笔数百万起），通过线下协议认购。

线下认购完成后，ops 手动初始化 payment。（todo: need confirm， payment 哪个字段关联的投资者）

```sql
create table a_payment ( -- 投资认购支付表， 1 event - n payments
  ID NUMBER AUTO_INCREMENT,
  evt_id NUMBER,
  pmt_no VARCHAR(16),
  pmt_amount DECIMAL,
  pmt_method VARCHAR(4),
  pmt_status VARCHAR(4),
  pmt_currency VARCHAR(4),
  pmt_date DATE,
  pmd_addl_checker NUMBER, -- risk control table, multi-checker involved.
  CREATED_AT DATE,
  UPDATED_AT DATE
)

```

### file-mapper

原始的债券创建流程，包含了多个步骤，需要 ops 跟着 sop 一步一步关联操作，耗时且有一定操作错误的可能性，在新的系统上，我们设计了一个 file-mapper 模块，将债券创建的流程自动化。

按照 细化的债券总模版（上线前配置一次） -> 自定义债券模板（基于总模板，用户自定义） -> 债券具体文件（用户上传，基于自定义的模板）的流程，实现自动化债券发行。

细化总模板阶段，ops 会整理出债券发行所能收集到的字段，字段属性，字段格式，是否必须，默认值等。比如债券编号，发行时间，发行人，机构信息，发行金额，发行币种，利率 等等。

细化的字段非常多，但是每次发行不一定都需要所有这些字段，所以抽象出 自定义债券模板 这一步骤，这个流程里，ops 选择债券模板后，系统会弹出必要的字段，用户可直接使用必要字段创建一个配置模板，也可以继续添加一些可选字段，最后完成配置模版的创建。配置模版包含了，字段信息，字段在 excel 的 列 的角标信息等。

配置模板的创建是为 ops 最后一步上传文件的服务的，所以配置模板的字段一定要与上传的 Excel 文件匹配。 ops 选择配置，并上传 excel，系统会按照配置的内容解析（比如配置模板的第一个字段对应 excel 的第一列，第二个字段对应第五列等），最终按配置生成一个 json，通过 http 发给 issuance 债券服务来自动创建债券，同时提供结果页显示成功和失败的记录，方便参考和修改。

债券的主要 table 见以上 main tables。

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


-- USER UPLOAD File
create table FM_UPLOAD (
  ID NUMBER AUTO_INCREMENT,
  FM_CONG_ID NUMBER,
  FM_LOCATION VARCHAR(255),
  FM_STATUS VARCHAR(4),
  CREATED_AT DATE,
  UPDATED_AT DATE
);

create table FM_PARSE_DETAIL ( -- 记录解析信息，在 issuance 服务逐条解析创建时，try-catch-finally 最后统计入表。
  ID NUMBER AUTO_INCREMENT,
  FM_UPLOAD_ID NUMBER,
  MSG VARCHAR(2048), -- e.g 200/200 records successfully created. 198/200 records create, 2/200 failed, reason: xxx
  CREATED_AT DATE,
  UPDATED_AT DATE
);

-- END
```

note：由于 file-mapper 良好的设计，现在不仅支持债券的自动化创建，还支持其他模板业务的自动化流程，如 rate-fixing，custody，clearing-system 等。


### skeleton-instrument

除了通过 file-mapper 创建债券，我们还构建了一个后台定时服务，对还没有发行但创建好的债券，进行数据重新计算（按汇率重新计算金额等），一个金融债券交易的骨架，大致包含如下信息：

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



## 跨境支付


### 账户行(Account Bank)

账户行跟债券没有关系，它是一家银行在另一家银行开立账户，并通过该账户进行跨境支付，清算等金融服务。

新系统对账户行迁移了两块重要内容。

1.展示清算通知的记录（receive-queue），即以 MT910 为核心的 record，MT910 是账户行在资金接收环节中，向账户持有人传递到账信息的核心工具，是清算的通知凭证。

```sql
select * from swift_outgoing_message where msg_type = '910';

-- display in ui
```


2.对符合要求的账户，自动进去结算(MT103/MT202)，（工作日 9 - 6 点，每 15 mins）

```java
void autoPaymentRelease() {
  var payments = getValidatedPayments();
  for (var p : payments) {
    sendReleaseMsgToPaymentWorkflow(p);
  }
}
```


### PPA(Principe Paying Agent)

当投资者购买了我们一级市场发行的债券，由于持有人分布在不同国家 / 地区，需要通过 PPA 统一协调付款流程，我们也重新设计了 PPA 服务。

- 支持创建需要支付的 payment
- payment 验证过程中，增加多种风控策略（按金额大小/级别审核）
- 引入 mq，在验证通过后，发到 mq，由 payment-workflow 服务统一对外支付
- 对特定币种，特定阈值下的 payment，支持自动 release。

claim-letter 在 ppa 中的作用是？



### IPA

### payment-workflow

```java
void paymentRelease() {
  try {
    releaseFunding();
    validateStatus();
    checkBalance();
    updateStatusDenomination();
    sendSwiftMessage();
  } catch(Exception ex) {

  }
}
```

---

## 资金托管(Custody)

新的服务重新设计了托管账号相关的管理功能，MT537 结算通知相关的功能，以及新开发的托管支付流程。

1.托管账号管理 (safekeeping account)。

方便托管人与搜托人进行沟通，以及交易结算。

```sql

create ct_sfkp ( -- 托管资产表
  ID NUMBER AUTO_INCREMENT,
  sfkp_no VARCHAR(32), -- e.g. SK202508120001
  sfkp_acc_id VARCHAR(32),
  assert_type VARCHAR(4), -- 资产类型，一般为债券
  assert_code VARCHAR(32), -- 债券的话为 isin_code
  currency VARCHAR(4),
  status VARCHAR(4),
  start_date DATE,
  maturity_date DATE,
  last_valuation_date DATE,
  agreement_id NUMBER, -- 关联托管协议编号
  CREATED_AT DATE,
  UPDATED_AT DATE
);

create ct_sfkp_acc ( -- 托管账户
  ID NUMBER AUTO_INCREMENT,
  sfkp_acc VARCHAR(32), -- unique
  client_id NUMBER, -- 关联客户实体表 (client_contact)
  status VARCHAR(4),
  email VARCHAR(255),
  CREATED_AT DATE,
  UPDATED_AT DATE
);

```

2.MT537 (Securities Settlement Transaction Status Advice - 证券结算交易状态通知）。

它主要用于在证券交易的结算环节，向相关参与方（如托管行、经纪商、客户等）通知证券结算交易的处理状态，例如确认交易已完成、提示交易失败及原因，通知部分结算等。

托管行根据每个工作日最新证券结算的相关状态数据，计算出托管账户最新的持仓信息，并通过 MT537 通知给客户。

虽从公司角度，MT537 是由我们托管行发出的，但是作为一个内部系统，我们也是 MT537 的一个接受方，系统会基于 MT537 生成 daily/monthly 的 pdf 的详细结算信息，ops 每个月也会将 monthly 投资信息的 pdf 通过 email 发送给 客户。

所以基于 MT537 反向创建 safekeeping account，也是我们系统的一个功能。

```sql
create table ct_sfkp_penalty(
  ID NUMBER AUTO_INCREMENT,
  sfkp_acc VARCHAR(32),
  transaction_ref VARCHAR(64), -- 20C
  status_code VARCHAR(4), -- 23G, 'STLD'= 已结算，'PEND'= 待处理，'RJCT'= 被拒绝
  status_reason VARCHAR(4), -- 79A 'INSU'= 资金不足，'INVA'= 无效账户
  isin_code VARCHAR(32), 
  quantity DECIMAL,
  currency VARCHAR(4),
  settlement_date DATE,
  CREATED_AT DATE,
  UPDATED_AT DATE
)

create table ct_sfkp_penalty_report(
  ID NUMBER AUTO_INCREMENT,
  sfkp_acc VARCHAR(32),
  frequency VARCHAR(4), -- daily/monthly
  location VARCHAR(255),
  CREATED_AT DATE,
  UPDATED_AT DATE
)
```

3.托管支付流程 custody payment instruction

是一个新功能，为了简化 ops 工作量的功能。 ops 谈的合同大多数基于邮箱邮件，由于邮件繁多，且每一个客户的流程状态无法直观记忆，故开发了此功能。


```sql
create table pmt_instruction(
  id NUMBER AUTO_INCREMENT,
  mail_id NUMBER,
  subject VARCHAR(255),
  status VARCHAR(6),
  receive_date DATE,
  comment VARCHAR(255),
  CREATED_AT DATE,
  UPDATED_AT DATE
);
```

  - 在读取到指定邮箱的邮件并入表保存后，展示在 receive queue 页面
  - ops 基于与用户的沟通，将记录 move 到对应的 authorise queue，signature queue，complete queue 等页面
  - 在 complete queue 之前，ops 可以生成并发送 103/202 支付指令，将收益汇给受益人。
  
---

## 基础服务

### swift-message

1.核心服务，负责监听所有入站的 swift message 的入口。使用 jms 监听 incoming queue，并根据路由配置转发到其他服务。

```sql
create table swift_incoming_message(
  id NUMBER AUTO_INCREMENT,
  module_identifier VARCHAR(32),
  msg_type VARCHAR(8),
  module_name VARCHAR(8),
  sft_msg TEXT,
  CREATED_AT DATE,
  UPDATED_AT DATE
);

create table swift_message_routing(
  id NUMBER AUTO_INCREMENT,
  msg_type VARCHAR(8),
  module_name VARCHAR(8),
  receive_url VARCHAR(255),
  CREATED_AT DATE,
  UPDATED_AT DATE
);
```

```java
@JmsListener(destination = "queue-name")
public void receive(String rawMessage) {
  try {
    // get delivery times from the broker, if more than 3 times, ignore processing. 
    // default delivery times is 10, by more observation, we see almost all re-delivery 
    // are due to our own handler logic, so its really not good to re-try with same error for 10 times.
    @Nullable BaseSwiftMessage swiftMsg = parseMessage(rawMessage);
    saveMessage(rawMessage, swiftMsg);
    List<Routing> routerConfs = getRoutingConfig(swiftMsg.msgType);
    callEachModule(routerConfs, swiftMsg);
  } catch (Exception ex) {
    // based on particular err to decide ignore or re-throw
  }
}

```

目前这里的实现方式有一定风险，尤其在消息堆压的情况下，事务里的 http 调用，很影响性能，吞吐会明显下降。

如果能重来，我会选择 outbox pattern，借助一张中间表分离 message 入表和 http call，当监听到 message 进来时，只做 db 的写操作，将状态记到中间表里，确保进来的消息能顺利持久化，同时通过 event 驱动，异步进行 http call 并更新状态。当然 http 有失败的情况，可采取定时扫描中间表并再次通过 event 进行 http call，直到成功为止。

增加吞吐的同时，保证了最终一致性。

2.目前入站的 swift 消息类型包括但不仅限于：

199：银行间的一般性信息传递，它并非支付指令，也不是银行资金担保或者资金承付的文件，不具备法律约束力的金融承诺性质。
210：核心作用是资金接收的预先通知。Notice to Receive
299：通常与金融交易（如支付、担保、贸易融资等）的补充说明或业务沟通相关。
548：确认证券在托管账户间的转移状态（证券存入 / 提取通知）。
537：同步证券结算的状态信息（证券结算交易状态通知）
568：记录和通知同一机构内部证券持仓的变动（账户内持仓变动通知）
599：传递无法通过其他标准化证券报文（如 MT537、MT548 等）覆盖的自定义信息，是证券业务沟通的补充工具。
799：银行间就保函、备用信用证等担保类业务进行沟通、确认或补充说明
910：通知账户贷记信息的标准化报文
999：银行与客户（包括企业、金融机构等）之间，传递与账户管理、资金流动相关的非标准化信息，是现金管理场景中灵活沟通的补充工具

当我们发起一笔汇款指令（103 或者 202）时，一般会收到 910 的 ack 信息，表示资金已到账，收到 999 的 ack，表示汇款存在问题，如账户信息不正确等。

### maintenance 

配置模版，各个业务模版需要的配置信息，都设计在此模块。

1.Threshold Config

PPA/Account_Bank/Issuance 的每笔账单校验，需要的 user 等级，以及需要几个 user 校验。

```sql
create table pmt_threshold(
  id NUMBER AUTO_INCREMENT,
  module_name VARCHAR(8),
  pmt_amount DECIMAL,
  check1_level NUMBER,
  check2_level NUMBER,
  check3_level NUMBER,
  status VARCHAR(4),
  CREATED_AT DATE,
  UPDATED_AT DATE
);
```

2.currency cutoff time 
```sql
create table pmt_ccy_cutoff(
  id NUMBER AUTO_INCREMENT,
  module_name VARCHAR(8),
  ccy VARCHAR(3),
  start_time VARCHAR(6),
  end_time VARCHAR(6),
  status VARCHAR(4),
  CREATED_AT DATE,
  UPDATED_AT DATE
); 
```

### mail-service

1.从 ops 指定的邮箱中读取邮件，并存储到数据库中，邮件内容为 payment 的一些信息确认信息。

```sql
create table inbound_mail ( -- 邮箱里的邮件信息
  id NUMBER AUTO_INCREMENT,
  mailbox VARCHAR(32), -- 哪个邮箱
  msg_id VARCHAR(255), -- 每封邮件的唯一 id
  subject VARCHAR(255),
  from VARCHAR(255),
  to VARCHAR(255),
  cc VARCHAR(255),
  receive_date DATE,
  mail_content CLOB -- 整个邮件的内容
)

create table inbound_mail_attachment ( -- 每封邮件的附件
  id NUMBER AUTO_INCREMENT,
  mail_id NUMBER,
  attachment CLOB
)

```

2.将读取的邮件，借助路由表通过 http 转发到配置的模板处理。
```sql
create table mail_routing(
  id NUMBER AUTO_INCREMENT,
  module_name VARCHAR(32),
  mailbox VARCHAR(32)
  receive_url VARCHAR(32)
);
```

由于公司的创建的邮箱只支持 pop3 协议，所以只能通过定时拉取的方式（每 5 分钟）获取 inbox 目录所有的邮件。

该方案有两个问题：1. 非实时获取 2. 性能问题，inbox 所有邮件会被多次拉取。且邮件会越来越多。

在运行了两年多后，零碎报出了线程 hang 住的情况，最终跟每个邮箱的 owner 协商，开启了 inbox 目录的自动归档功能，超过一个月的邮件自动 move 到 archive 目录，又平稳运行了 2 年多，不在有新的问题。


### rate-fixing


### ETL

涵盖几十个需要批处理的 job，选择了 spring-batch 作为 etl 开发的基本框架。

1.HR_FEED：每天拉取整个公司员工（40w+）的信息，过滤出 emea & apac 的员工，提取出 id，manager id，region，level 等信息落表。用于支付流程授权时风控校验。

```sql
create table user_detail (
  id NUMBER AUTO_INCREMENT,
  u_id VARCHAR(7),
  m_id VARCHAR(7),
  level VARCHAR(2),
  region VARCHAR(5),
  CREATED_AT DATE,
  UPDATED_AT DATE
);
```

```java
@Bean
ItemReader<User> reader() {
  var itemReader = new FlatFileItemReader(filePath);
  LineMapper<User> lineMapper = new DefaultLineMapper<>();
  var lineTokenizer = new DelimitedLineTokenizer();
  lineTokenizer.setDelimiter(",");
  lineTokenizer.setNames(Arrays.stream(User.class.getDeclaredFields()).map(Field::getName).toArray(String[]::new));
  defaultLineMapper.setLineTokenizer(lineTokenizer);
  var fieldSetMapper = new BeanWrapperFieldSetMapper<>();
  fieldSetMapper.setTargetType(User.class);
  defaultLineMapper.setFieldSetMapper(fieldSetMapper);
  return itemReader;
}

@Bean
ItemProcessor<User, User> processor() {
  return new ItemProcessor<User, User>() {
    User process(User user) {
      // filter user.region equal apac or emea
    }
  };
}

@Bean
ItemWriter<Person> writer() {
  return new JdbcBatchItemWriter<>() {
    setSql("insert into user values xxxx ");
  }
}

```

由于读取的文件非常大，每行的字段也非常多，这里采取了两种优化策略，最终将 job 的时间控制在 40s 左右。

  1. 将大文件切割，在 batch 增加一个前置的 tasklet，使用 linux command `split` 按 5000 行一个子文件，将大文件切割成 8 - 10 个小文件。通过线程池并发处理这些小文件。
  2. spring batch 中的 LineMapper 支持指定列的提取，这样每一行数十个字段，我们只要给定位置，就能将需要的字段提取出来。

2.GENSIS_FEED daily/monthly， 核心流程与上面类似，不在叙述。


特别想说，在写单元测试时，mock 那一套，对于 spring batch 或者 spring integration 来说，不适用，我看到了大量的 mock 框架里面实现类的单测，层层 mock，毫无意义。

更多的是需要写集成测试，由于 etl 积累的大量的 job，如果每个 job 都启动一个大的 application content，ci 的时间会很长。所以最终在写集成测试时，指定需要加载进 spring context 的类文件，经此改造，etl 项目的 ci 时间由 15 mins 降低到 6 mins。

当然由于内网本地无法安装 docker，build 容器的内存也有限，否则 test container 是一个更佳的选择。我们实际 数据库是 Oracle，但 ci 阶段只能折中选择 h2，db 层面的差异比如 view 的支持，也导致集成测试需要做一些额外的配置或妥协。


---


## 监管合规

### 制裁审查(Sanction Screening)

该功能也是我主导设计，ISO 是 2025 年一个监管要求，国际件银行通信标准需要由 swift 格式转换到 ISO xml 的格式。

incoming message 的 screening 在 swift-message 服务监听到时，就会触发。
outgoinh message 在手动创建时触发。

```sql
create table sft_sanc_screening(
  id NUMBER AUTO_INCREMENT,
  msg_type VARCHAR(3),
  msg_identifier VARCHAR(32),
  re_screening VARCHAR(1),
  direction VARCHAR(1),
  xml_body text,
  request_time DATE,
  response_time DATE,
  status VARCHAR(6),
  CREATED_AT DATE,
  UPDATED_AT DATE
);
```

设计时按照抽象和组合的原则，划分了新老 message 的接口流程，增加类似 spring 中的 aware 回调，以及较为公共实现的 support 类。

```java
interface ISanctionScreeningService<T extends BaseSwiftPayload> extends ISanctionScreeningNewFlowService<S extends NewPayload>, ISacntionScreeningAware {
  performScreening(ScreeningRequest screeningRequest) {
    try{
      beforeScreening(screeningRequest);
      var message = fetchMessage(screeningRequest);
      if (isNewMessage(screeningRequest)) {
        var canonicalModel = callPartnerATeam(message);
        var sancScreenng = persistSancScreening(screeningRequest, null);
        callPartnerBTeam(canonicalModel);
      } else {
        var swift = parseMessage(message);
        var hdr = generateXmlHeader(swift);
        var body = generateXmlBody(swift);
        var sancScreenng = persistSancScreening(screeningRequest, hdr + body);
        sendToMqForScreening(sancScreenng);
      }
    } catch(Exception ex) {
      handleException(ex);
    } finally {
      afterScreening(screeningRequest);
    }
  }
}

@KafkaListener("new-flow-queue") 
public void kafkaResponse(Consumer<Record> record) {
  var response = record.get();
  var sancScreening = parseMessage(response);
  updateSancScreening(sancScreening);
}

@JmsListener("existing-screening-queue")
public void jmsListener(response) {
  var response = record.get();
  var sancScreening = parseMessage(response);
  updateSancScreening(sancScreening);
}

```

### ISO message

ISO 具体的生成服务由另一个团队提供。不在叙述。







