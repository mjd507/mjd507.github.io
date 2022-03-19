---
title: Junit 5
categories: Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2022-03-19 21:39:51
tags:
---

https://junit.org/junit5/docs/current/user-guide/#overview

<!--more-->

Parameterized Tests

several cases for testing with at least one source to provide the arguments.

## ValueSource

```java
    @ParameterizedTest
    @ValueSource(strings = {"racecar", "radar", "able was I ere I saw elba"})
    void palindromes(String candidate) {
        assertTrue(StringUtils.isPalindrome(candidate));
    }

```

## EnumSource

```java
    @ParameterizedTest
    @EnumSource(value = Person.Gender.class)
    void testWithEnumSource(Person.Gender gender) {
        assertTrue(Person.Gender.F == gender || Person.Gender.M == gender);
    }

```

## MethodSource

```java
    @ParameterizedTest
    @MethodSource("stringIntAndListProvider")
    void testWithMultiArgMethodSource(String str, int num, List<String> list) {
        assertEquals(5, str.length());
        assertTrue(num >= 1 && num <= 2);
        assertEquals(2, list.size());
    }

    static Stream<Arguments> stringIntAndListProvider() {
        return Stream.of(
                arguments("apple", 1, Arrays.asList("a", "b")),
                arguments("lemon", 2, Arrays.asList("x", "y"))
        );
    }
```

## CsvSource

```java
    @ParameterizedTest
    @CsvSource({
            "Jane, Doe, F, 1990-05-20",
            "John, Doe, M, 1990-10-22"
    })
    void testWithArgumentsAccessor(ArgumentsAccessor arguments) {
        Person person = new Person(arguments.getString(0),
                arguments.getString(1),
                arguments.get(2, Person.Gender.class),
                arguments.get(3, LocalDate.class));

        if (person.getFirstName().equals("Jane")) {
            assertEquals(Person.Gender.F, person.getGender());
        } else {
            assertEquals(Person.Gender.M, person.getGender());
        }
        assertEquals("Doe", person.getLastName());
        assertEquals(1990, person.getDateOfBirth().getYear());
    }
```

## CsvFileSource

```java
    @ParameterizedTest
    @CsvFileSource(resources = "/two-column.csv", numLinesToSkip = 1)
    void testWithCsvFileSourceFromClasspath(String country, int reference) {
        assertNotNull(country);
        assertNotEquals(0, reference);
    }

    // content in resources/two-column.csv
    // COUNTRY, REFERENCE
    // Sweden, 1
    // Poland, 2
    // "United States of America", 3
    // France, 700_000
```

## ArgumentsSource

```java
    @ParameterizedTest
    @ArgumentsSource(MyArgumentsProvider.class)
    void testWithArgumentsSource(String argument) {
        assertNotNull(argument);
    }

    static class MyArgumentsProvider implements ArgumentsProvider {

        @Override
        public Stream<? extends Arguments> provideArguments(ExtensionContext context) {
            return Stream.of("apple", "banana").map(Arguments::of);
        }
    }
```

## Custom Aggregator

```java
    @ParameterizedTest
    @CsvSource({
            "Jane, Doe, F, 1990-05-20",
            "John, Doe, M, 1990-10-22"
    })
    void testWithCustomAggregatorAnnotation(@CsvToPerson Person person) {
        if (person.getFirstName().equals("Jane")) {
            assertEquals(Person.Gender.F, person.getGender());
        } else {
            assertEquals(Person.Gender.M, person.getGender());
        }
        assertEquals("Doe", person.getLastName());
        assertEquals(1990, person.getDateOfBirth().getYear());
    }

// CsvToPerson
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
@AggregateWith(PersonAggregator.class)
public @interface CsvToPerson {
}

// PersonAggregator
public class PersonAggregator implements ArgumentsAggregator {
    @Override
    public Person aggregateArguments(ArgumentsAccessor arguments, ParameterContext context) {
        return new Person(arguments.getString(0),
                arguments.getString(1),
                arguments.get(2, Person.Gender.class),
                arguments.get(3, LocalDate.class));
    }
}
```
