---
title: Learn Spring-Messaging
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2025-04-06 17:46:04
tags:
---

when I try to read the spring-integration code, I find it is essential to know spring-messaging first. some concepts are same like message channel, pollable / subscribable channel, asynchronious, integration, etc.

spring-messaging is a sub-module under spring-framework. it highly abstracts the components when two systems needs to communicate via messages. 

<!--more-->

## **org.springframework.messaging**

- **Message**: a generic message representation with headers and body.
- **MessageHeaders**: the headers for a Message. immutable class.

- **MessageChannel**: a place where messages can be sent to or received from.
  - **PollableChannel**: A MessageChannel from which messages received through polling.
  - **SubscribableChannel**: A MessageChannel the maintains a subscribers and invokes the to handle messages sent through this channel.

- **MessageHandler**: simple contract for handling a Message.

- **MessageException**: the base exception for any failures related to messaging.
  - **MessageDeliveryException**: Exception that indicates an error occurred during message delivery.
  - **MessageHandlingException**: Exception that indicates an error occurred during message handling.

## **org.springframework.messaging.support**

- **GenericMessage**: An implementation of Message with a generic payload.
  - **ErrorMessage**: A GenericMessage with a Throwable payload.

- **MessageHeaderAccessor**: Wrapper around MessageHeaders that provides extra features such as strongly typed accessors for specific headers, the ability to leave headers in a Message mutable, and the option to suppress automatic generation of MessageHeaders.ID and MessageHeaders.TIMESTAMP headers. Subclasses such as NativeMessageHeaderAccessor and others provide support for managing processing vs external source headers as well as protocol specific headers.
  - **NativeMessageHeaderAccessor**: MessageHeaderAccessor subclass that supports storage and access of headers from an external source such as a message broker. Headers from the external source are kept separate from other headers, in a sub-map under the key NATIVE_HEADERS. This allows separating processing headers from headers that need to be sent to or received from external source.

- **MessageBuilder**: A builder for creating a GenericMessage or ErrorMessage if the payload is of type Throwable.

- **MessageHeaderInitializer**: Callback interface for initializing a MessageHeaderAccessor.
  - **IdTimestampMessageHeaderInitializer**: A MessageHeaderInitializer to customize the strategy for ID and TIMESTAMP message header generation.

- **HeaderMapper**: Generic strategy interface for mapping MessageHeaders to and from other types of objects. this would typically be used by adapters where the 'other type' has a concept of headers or properties (HTTP, JMS, AMQP, etc).
  - **AbstractHeaderMapper**: A base HeaderMapper implementation.

- **ChannelInterceptor**: Interface for interceptors that are able to view and/or modify the Message being sent-to and/or received-from a MessageChannel.
  - **ExecutorChannelInterceptor**: An extension of ChannelInterceptor with callbacks to intercept the asynchronous sending of a Message to a specific subscriber through an Executor.
  - **ImmutableMessageChannelInterceptor**: A simpler interceptor that calls MessageHeaderAccessor.setImmutable() on the headers of messages passed through the preSend method.
- **InterceptableChannel**: A MessageChannel that maintains a list ChannelInterceptors and allows interception of message sending.

- **AbstractMessageChannel**: Abstract base class for MessageChannel implementations.with interception capability.
  - **AbstractSubscribableChannel**: Abstract base class fro SubscribableChannel implementations.
    - **ExectorSubscribableChannel**: A SubscribableChannel that sends messages to each of its subscribers.


## **org.springframework.messaging.converter**

- **MessageConverter**: A converter to turn the payload of a Message from serialized form to a typed Object and vice versa. The MessageHeaders.CONTENT_TYPE message header may be used to specify the media type of the message content.
  - **SimpleMessageConverter**
    - **GenericMessageConverter**
  - **SmartMessageConverter**
    - **CompositeMessageConverter**
    - **AbstractMessageConverter**
      - **ByteArrayMessageConverter**
      - **MappingJackson2MessageConverter**
      - **MarshallingMessageConverter**
      - **ProtobufMessageConverter**
      - **StringMessageConverter**
      - **AbstractJsonMessageConverter**
        - **GsonMessageConverter**
        - **JsonbMessageConverter**


## **org.springframework.messaging.core**

- **MessageSendingOperations**: Operations for sending messages to a destination.
  - **DestinationResolvingMessageSendingOperations**: Extends MessageSendingOperations and adds operations for sending messages to a destination specified as a (resolvable) string name. 
- **MessageReceivingOpertions**: Operations for receiving messages from a destination.
  -**DestinationResolvingMessageReceivingOperations**: Extends MessageReceivingOpertions and adds operations for receiving messages from a destination specified as a (resolvable) string name.
- **MessageRequestReplyOperations**: Operations for sending messages to and receiving the reply from a destination.
  --**DestinationResolvingMessageRequestReplyOperations**: Extends MessageRequestReplyOperations and adds operations for sending and receiving messages to and from a destination specified as a (resolvable) string name.


- **AbstractMessageSendingTemplate**: Abstract base cass for implementations of MessageSendingOperations.
  - **AbstractMessageReceivingTemplate**: An extension of AbstractMessageSendingTemplate that adds support for receive style operations as defined by MessageReceivingOpertions.
    - **AbstractMessageTemplate**: An extension of AbstractMessageReceivingTemplate that adds support for request-reply style operation as defined by MessageRequestReplyOperations.
      - **AbstractDestinationResolvingMessagingTemplate**: An extension of AbstractMessagingTemplate that adds operations for sending messages to a resolvable destination name.

- **DestinationResolver**: Strategy for resolving a String destination name to an actual destination.
  - **BeanFactoryMessageChannelDestinationResolver**: An implementation of DestinationResolver that interprets a destination name as the bean name of a MessageChannel and looks up the bean in the configured BeanFactory.
  - **CachingDestinationResolverProxy**: DestinationResolver implementation that proxies a target DestinationResolver, caching its resolveDestination results. Such caching is particularly useful if the destination resolving process is expensive (for example, the destination has to be resolved through an external system) and the resolution results are stable anyway.

- **GenericMessagingTemplate**: A messaging template that resolves destination names to MessageChannel's to send and receive messages from.


