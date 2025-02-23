---
title: Spring Integration
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2022-04-17 16:40:48
tags:
---

https://docs.spring.io/spring-integration/reference/html/dsl.html#java-dsl

<!--more-->

Feed Data to File

```java
@Configuration
@EnableIntegration
public class IntegrationFlowConfig {

    @Bean
    public MessageChannel directChannel() {
        return new DirectChannel();
    }


    @SneakyThrows
    @Bean
    public IntegrationFlow feedToChannelIntegrationFlow() {
        UrlResource urlResource = new UrlResource("https://spring.io/blog.atom");
        FeedEntryMessageSource messageSource = new FeedEntryMessageSource(urlResource, "myKey");
        return IntegrationFlows.from(messageSource, c -> c.poller(Pollers.fixedRate(5000)))
                .transform("payload.title + ' @ ' + payload.link + ';'")
                .channel(directChannel())
                .get();
    }

    @Bean
    public IntegrationFlow channelToFileIntegrationFlow() {
        FileWritingMessageHandler messageHandler = new FileWritingMessageHandler(new File("src/main/resources/integration"));
        messageHandler.setFileExistsMode(FileExistsMode.APPEND);
        messageHandler.setCharset(Charsets.UTF_8.toString());
        messageHandler.setExpectReply(false);
        return IntegrationFlows.from(directChannel())
                .handle(messageHandler)
                .get();

    }

}
```
