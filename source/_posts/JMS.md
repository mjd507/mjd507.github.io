---
title: JMS
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2022-04-16 18:01:46
tags:
---

https://docs.spring.io/spring-framework/docs/3.0.x/spring-framework-reference/html/jms.html

<!--more-->

## Configuration

```java
@Configuration
@EnableJms
public class JmsConfig {


    @Bean // Serialize message content to json using TextMessage
    public MessageConverter jacksonJmsMessageConverter() {
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setTargetType(MessageType.TEXT);
        converter.setTypeIdPropertyName("_type");
        return converter;
    }

    @Bean
    public Queue queue() {
        return new ActiveMQQueue("amq");
    }
}
```

## Producer

```java
// msg entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Email {
    private String to;
    private String body;
}

@Component
@RequiredArgsConstructor
public class MsgSender {
    private final JmsMessagingTemplate jmsMessagingTemplate;
    private final Queue queue;

    public void send() {
        jmsMessagingTemplate.convertAndSend(queue, new Email("info@example.com", "Hello"));
    }
}
```

## Consumer

```java
@Component
@Slf4j
public class MsgReceiver {

    @JmsListener(destination = "amq")
    public void receive(Email email) {
      log.info("Received < {} >", email);
    }
}
```

