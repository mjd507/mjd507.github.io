---
title: Docker-Compose in Spring Boot
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2025-07-20 12:12:49
tags:
---

> Docker Compose simplifies the management of multi-container applications by defining services, networks, and volumes in a single YAML file. 

with a single command, we can create and start all the services from yaml file.

let's see how we use docker compose in Spring Boot. [Github Demo](https://github.com/mjd507/docker-compose) / [Docker Compose Support in Spring Boot](https://www.baeldung.com/docker-compose-support-spring-boot)

<!--more-->

## `build.gradle` 
```gradle
dependencies {
  implementation 'org.springframework.boot:spring-boot-starter-data-mongodb'
  implementation 'org.springframework.boot:spring-boot-starter-web'
  developmentOnly 'org.springframework.boot:spring-boot-docker-compose'
}

```

## compose.yaml

create a `compose.yaml` file, with `mongodb` service.

```yml
services:
  mongodb:
    image: 'mongo:latest'
    environment:
      - 'MONGO_INITDB_DATABASE=mydatabase'
      - 'MONGO_INITDB_ROOT_PASSWORD=secret'
      - 'MONGO_INITDB_ROOT_USERNAME=root'
    ports:
      - '27017:27017'
```

## `application.yml`

```yml
spring:
  docker:
    compose:
      enabled: true
      file: compose.yaml
```

## code

```java
@SpringBootApplication
public class DockerComposeApplication {

  public static void main(String[] args) {
    SpringApplication.run(DockerComposeApplication.class, args);
  }

}

@Document("item")
record Item(@Id String id, String name, int quantity, String category) {

}

@RestController
@RequestMapping("/item")
class ItemController {

  private final ItemRepository itemRepository;

  ItemController(ItemRepository itemRepository) {
    this.itemRepository = itemRepository;
  }

  @PostMapping(consumes = APPLICATION_JSON_VALUE)
  public ResponseEntity<Item> save(@RequestBody Item item) {
    return ResponseEntity.ok(itemRepository.save(item));
  }

}

@Repository
interface ItemRepository extends CrudRepository<Item, String> {

}
```

## test

```shell
curl --location 'http://localhost:8080/item' \
--header 'Content-Type: application/json' \
--data '{
    "name" : "abc",
    "quantity" : 1,
    "category" : "a"
}'

{"id":"687c69ed06ca4cdf4d3372f3","name":"abc","quantity":1,"category":"a"}
```



End.


