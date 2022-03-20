---
title: Jackson
categories: Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2022-03-20 16:36:41
tags:
---

https://www.baeldung.com/jackson

<!--more-->

## class hierarchies in Jackson

> Annotation used for configuring details of if and how type information is used with JSON serialization and deserialization, to preserve information about actual class of Object instances. This is necessarily for polymorphic types, and may also be needed to link abstract declared types and matching concrete implementation.

```java
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = Car.class, name = "car"),
        @JsonSubTypes.Type(value = Truck.class, name = "truck")
})
@Data
public abstract class Vehicle {
    private String make;
    private String model;
}

@EqualsAndHashCode(callSuper = true)
@Data
public class Car extends Vehicle {
    private int seatingCapacity;
    private double topSpeed;
}

@EqualsAndHashCode(callSuper = true)
@Data
public class Truck extends Vehicle {
    private double payloadCapacity;
}

// test
    static Stream<Arguments> vehicleProvider() {
        Car car = new Car();
        car.setMake("Mercedes-Benz");
        car.setModel("S500");
        car.setTopSpeed(250.0);
        car.setSeatingCapacity(5);
        Truck truck = new Truck();
        truck.setMake("Isuzu");
        truck.setModel("NQR");
        truck.setPayloadCapacity(7500.0);
        return Stream.of(
                arguments(car, "car"),
                arguments(truck, "truck")
        );
    }

    @SneakyThrows
    @ParameterizedTest
    @MethodSource("vehicleProvider")
    void testVehicleJson(Vehicle vehicle, String type) {
        ObjectMapper objectMapper = new ObjectMapper();
        String jsonStr = objectMapper.writeValueAsString(vehicle);
        //{"type":"car","make":"Mercedes-Benz","model":"S500","seatingCapacity":5,"topSpeed":250.0}
        //{"type":"truck","make":"Isuzu","model":"NQR","payloadCapacity":7500.0}
        assertTrue(jsonStr.contains(type));
    }
```
