---
title: GBS
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2026-05-18 11:02:40
tags:
---

On-Going...

<!--more-->

## US-HK Payment Control

从美国发起的 Pacs.008 或者 Pacs.009 转账消息进入香港 swift 网络后，在落入 core-banking (记账本) 之前，我们搭建了一个 Payment Control System，进行 Payment 的 parse，creation，screening，release（leverage core-banking）。

Payment creation 和 release 所需考虑的问题，和 citi 做的基本一致。

- idempotency, duplicate check.
- performance.
- re-processing (retry).
- monitoring & alert.

解决方案也大体相同。

HK Payment 的创建和支付，都通过 swift `文件` 的形式在流转。

```java
@Transactional
void createPayment(PaymentCreateReq req) {
  try {
      // idempotency
      boolean inserted = idempotencyService.insert(buildIdempotencyReq(req)); // leverage db unique idx
      if (!inserted) {
        log.warn("another instance is creating this payment, skip");
        return;
      }
      var swiftPayload = parseSwift(readFileContent(req.swiftFile));
      var payment = savePayment(swiftPayload, "sp_initiate_payment"); // stored-procedure
      savePaymentOutbox(payment, PaymentAction.MOVE_FILE_TO_PROCESSED);
  } catch (PaymentCreateException ex) {
      handlePaymentCreationException(req, ex);
  }
}

void handlePaymentCreationException(PaymentCreateReq req, PaymentCreateException ex) {
  var errCode = ex.getCode();
  switch errCode:
    case ErrCode.ParseErr:
      log.error("pasring swift failed", ex); // email alert based on log.
      savePaymentOutbox(payment, PaymentAction.MOVE_FILE_TO_NOT_PROCESSED);
      break;
    case ErrCode.CreateErr:
      log.error("save payment failed", ex); // alert & should be fixed case by case.
      throw ex;
}

@Scheduled(fixedDelay= 300*1000)
@SchedulerLock(name = "pmt_creation_outbox_lock", lockAtLeastFor = "1m")
void paymentOutboxHandler(PaymentOutbox outbox) {
  var pmtAction = outbox.action;
  switch pmtAction:
    case PaymentAction.MOVE_FILE_TO_PROCESSED: 
    case PaymentAction.MOVE_FILE_TO_NOT_PROCESSED: 
      moveFile(outbox);
      break;
    default: 
      break;
}

```

by default, Payment is created with `Initiated` status, we have a seperated screening processor (see OFAC section),
once screening approved, payment are able to be released.

```java
@Transactional
void releasePayment(PaymentReleaseReq req) {
    try {
      // idempotency using version - optimistic lock
      boolean updated = idempotencyService.update(buildIdempotencyReq(req));
      if (!updated) {
        log.warn("another instance is releasing this payment, skip");
        return;
      }
      checkPayment(req);
      updatePayment(req, "RLSD");
      if (req.direction == DIRECTION.IN) {
         savePaymentOutbox(req, PaymentAction.MOVE_FILE_TO_OUTPUT); // move output for core-banking use
      } else { // OUT，代表自己只是作为中间行的角色
         savePaymentOutbox(req, PaymentAction.CALL_CORE_BANKING);
         savePaymentOutbox(req, PaymentAction.DELETE_FILE);
      }     
    } catch (PaymentReleaseException ex) {
      log.error("payment release failed", ex);
      throw ex;
    }

}

@Scheduled(fixedDelay= 300*1000)
@SchedulerLock(name = "pmt_release_outbox_lock", lockAtLeastFor = "1m")
void paymentOutboxHandler(PaymentOutbox outbox) {
  var pmtAction = outbox.action;
  switch pmtAction:
    case PaymentAction.MOVE_FILE_TO_OUTPUT -> moveFile(outbox);
    case PaymentAction.CALL_CORE_BANKING -> callCoreBanking(outbox);
    case PaymentAction.DELETE_FILE -> deleteFile(outbox);
    default: break;
}

```

## OFAC API


## 信贷管理（Integrated Lending Management）

背景：私有化部署的贷款数据系统，部分功能不稳定，影响使用，多方评估后，决定采用合作方的云服务系统，通过 api 的方式交互。

该项目作为一个 api connector 项目，仍然从 Resilience 角度设计和开发。

- OAuth 2.0 (with certificates)
- Idempotency
- Retry 
- error handling
- monitoring

Canonical Payload for internal different data sources.






