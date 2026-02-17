---
title: Thought in Coding
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2026-02-17 12:04:20
tags:
---

Regarding:

- Does Flow need Abstraction
- Throw Exception or Return Status value
- Custom Exception
- Use Transaction
- Retry/Re-Processing

<!--more-->

Below is a happy `abstraction flow`, for message sanction screening inside banks.

``` java 
public interface ISanctionScreening {

  void doScreening(ScreeningRequest request) {
      try {
        var screeningMessage = getScreeningMessage(request);
        var parsedMessage = ParseMessage(screeningMessage);
        var response = callScreening(parsedMessage);
        persistScreening(request, parsedMessage, response);
      } catch (SancetionScreeningException ex) {
        handleScreeningException(ex);
      }
  }

  ScreeningMessage getScreeningMessage(ScreeningRequest request);
  ParseMessage parsedMessage(String msg);
  ScreeningResponse callScreening(ParseMessage parsedMessage);
  void persistScreening(ScreeningRequest request, ParseMessage parsedMessage, ScreeningResponse response);
  void handleScreeningException(SancetionScreeningException exception);
}

```

Personally, I like abstraction, although I always frequently ask myself is this really a good abstraction :)

in this happy flow, we assume each stage `returns an expected response` (non-null), if not, an expection should be thrown out inside each stage implementation.

Now what will happen if flow failed at `getScreeningMessage` or `ParseMessage` or `callScreening`, how can we hanlde them in a more centralized way.

here comes `custom exception`, each stage try-catch block can return a custom screening exception with `specific error code`. 

```java
public void handleScreeningException(SancetionScreeningException ex) {

  switch (ex.getErrorCode())
    case GET_MESSAGE_FAILED -> log.error("get message failed..", ex),
    case PARSE_FAILED -> log.error("invalid message..", ex),
    case CALL_FAILED -> log.error("call screening api failed ..", ex),
    default -> log.error("unexpected error..", ex)
}
```

------

should we use transaction?

previouly, I like transaction, all or nothing, I can easily say the request data are not valid, you should fix the request first; or, I can say our parter's system are not stable, so the request failed and lost.

now I perfer stage tracking or state-machine pattern, without transaction. no data lost, and safe-reprocessing.


``` java 
public interface ISanctionScreening {

  void doScreening(ScreeningRequest request) {
      var dbRecord = null;
      try {
        dbRecord = initiateAndSaveRequest(request);
        var parsedMessage = ParseMessage(dbRecord);
        response = callScreening(dbRecord, parsedMessage);
        dbRecord.status = "Success";
        persistScreening(dbRecord);
      } catch (SancetionScreeningException ex) {
        handleScreeningException(dbRecord, ex);
      }
  }
  ScreeningRecord initiateAndSaveRequest(ScreeningRequest request);
  ParseMessage parsedMessage(ScreeningRecord record);
  ScreeningResponse callScreening(ScreeningRecord record, ParseMessage parsedMessage);
  void persistScreening(ScreeningRecord dbRecord);
  void handleScreeningException(ScreeningRecord record, SancetionScreeningException exception);
}
```

inside each concrete stage, if failed, we throw custom exception, inside the exception handler method, we save the dbRecord with stage specific status.

```java
public void handleScreeningException(ScreeningRecord record, SancetionScreeningException ex) {

  switch (ex.getErrorCode())
    case GET_MESSAGE_FAILED -> record.status = GET_MESSAGE_FAILED,
    case PARSE_FAILED -> record.status = PARSE_FAILED,
    case CALL_FAILED -> record.status = CALL_FAILED,

  persistScreening(record);
}
```

now we can `retry` or `re-processing` can based on particalar status records in database.


End.


