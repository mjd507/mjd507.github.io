---
title: Spring Boot Customize Highest Priority Properties
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2022-07-23 18:39:25
tags:
---

this is useful for security-related configuration like password. 

<!--more-->

suppose in our spring-boot application, contains below config in yaml.

```yaml
app:
  user: abc
  pswd: ${secret}
```

the ${secret} is not refer to the real password, instead, it is a secret for fetching the real password from particular security platform.

so when we run our application, we first need to resolve the real password.

one elegant way would be:

1. define a `ApplicationListener`, and add to springApplication listeners.

2. when the `Environment` prepared, implement the real password retrieve method by the provided secret.

3. put into the first of the PropertySources list of this environment. 


this can make sure each time, when we get `secret` from environment, it will always return the first real password.


here is the code and output:

```java
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        System.setProperty("secret", "this_can_be_set_in_system");
        SpringApplication application = new SpringApplication(Application.class);
        application.addListeners((ApplicationListener<ApplicationEnvironmentPreparedEvent>) event -> {
            ConfigurableEnvironment environment = event.getEnvironment();
            Map<String, Object> properties = new HashMap<>();
            properties.put("secret", "get_by_secret(sys.get(secret))");
            MapPropertySource highestPriorityProperties = new MapPropertySource("highestPriorityProperties", properties);
            environment.getPropertySources().addFirst(highestPriorityProperties);
        });
        ConfigurableApplicationContext applicationContext = application.run(args);
        Object appConfig = applicationContext.getBean("appConfig");
        System.out.println(appConfig);
    }
}
// AppConfig(user=abc, pswd=get_by_secret(sys.get(secret)))

```




