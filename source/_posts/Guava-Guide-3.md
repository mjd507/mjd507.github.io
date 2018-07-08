---
title: Guava 3 - Collections - 1
categories: Java
toc: true
comments: true
copyright: true
date: 2018-06-14 08:58:03
tags:
visible:
---

Guava 对 JDK 的集合做了很多封装。代码中用到集合的地方，可以先找找 guava 里有没有实现，让代码的可读性更好。

<!--more-->

## Iterables

guava 提供的集合工具方法跟偏于接受 Iterable 类型而不是 Collection 类型，在 Google，对于不存放在主存的集合 ——比如从数据库或其他数据中心收集的结果集，因为实际上还没有攫取全部数据，这类结果集都不能支持类似 size() 的操作 —— 通常都不会用 Collection 类型来表示。因此 guava 提供了 Iterables 类来支持所有集合的操作。



## Lists

```java
// List 集合 封装类 Lists
// ==================== ArrayList ==================== //
ArrayList list = Lists.newArrayList(); // 创建一个 ArrayList
ArrayList list = Lists.newArrayList("a","b","c"); // 创建带有元素的 ArrayList 
ArrayList list = Lists.newArrayList(Iterable<? extends E> otherIterable); // 基于另一个集合创建一个 ArrayList
ArrayList list = Lists.newArrayListWithCapacity(10); // 创建一个容量为 10 的集合
ArrayList list = Lists.newArrayListWithExpectedSize(10); // 创建一个以 10 为基准估算的容量大小，Ints.saturatedCast(5L + arraySize + (arraySize / 10));

// ==================== LinkedList ==================== //
LinkedList list = Lists.newLinkedList(); // 创建 LinkedList
LinkedList list = Lists.newLinkedList(Iterable<? extends E> otherIterable); // 基于另一个集合创建一个 LinkedList，JDK 7 及以后，可以直接使用 LinkedList 的构造方法传一个集合

// ... CopyOnWriteArrayList

// 合并集合
List<E> list = Lists.asList(@Nullable E first, E[] rest); // 将一个元素 和 一个集合 合并成一个集合
List<E> list = Lists.asList(@Nullable E first, @Nullable E second, E[] rest); // 将两个元素 和 一个集合 合并成一个集合

// 笛卡尔积
List<List<B>> list = Lists.cartesianProduct(List<? extends List<? extends B>> lists); // 返回多个集合的笛卡尔积值
List<List<String>> lists = Lists.cartesianProduct(Arrays.asList("1", "2"), Arrays.asList("a", "b", "c")); // [[1, a], [1, b], [1, c], [2, a], [2, b], [2, c]]

// 函数式, 更推荐 Java8 的 stream 操作
List<T> list = Lists.transform(List<F> fromList, Function<? super F, ? extends T> function);
List<Integer> list = Lists.transform(Arrays.asList("1", "2"), i -> Integer.parseInt(i) + 1); // [2, 3]

// 集合分块
List<List<T>> lists =  Lists.partition(List<T> list, int size); // 按指定大小，将集合分成若干个小集合，最后一个可能会小于指定 size
List<List<Integer>> partition = Lists.partition(Ints.asList(1, 2, 3, 4, 5), 2); // [[1, 2], [3, 4], [5]]

// 将字符串转换为字符集合
ImmutableList<Character> list = Lists.charactersOf(String string);
ImmutableList<Character> list = Lists.charactersOf("abc"); // [a, b, c]

// 反转集合
List<T> list = reverse(List<T> list);
List<Integer> list = Lists.reverse(Ints.asList(1, 2, 3)); //[3, 2, 1]
```



## Maps

```java
// 创建 HashMap
Map map = Maps.newHashMap();
Map map = Maps.newHashMap(Map<? extends K, ? extends V> map);
Map map = Maps.newHashMapWithExpectedSize(int expectedSize); // 创建一个符合期望大小的 HashMap
Map map = Maps.newConcurrentMap(); // 创建一个 ConcurrentHashMap

// 创建一个 EnumMap, EnumMap 可以用来代替索引，以及处理不太频繁改变的对象之间的挂载。
enum DEPARTMENT {
  UI, DEVELOP, TEST;
}
EnumMap<DEPARTMENT, Map<String,String>> map = Maps.newEnumMap(DEPARTMENT.class);
map.put(DEPARTMENT.UI, Maps.toMap(Arrays.asList("ui-1", "ui-2"), k -> k + " info"));
map.put(DEPARTMENT.DEVELOP, Maps.toMap(Arrays.asList("dev-1", "dev-2"), k -> k + " info"));
map.put(DEPARTMENT.TEST, Maps.toMap(Arrays.asList("test-1", "test-2"), k -> k + " info"));
// {UI={ui-1=ui-1 info, ui-2=ui-2 info}, DEVELOP={dev-1=dev-1 info, dev-2=dev-2 info}, TEST={test-1=test-1 info, test-2=test-2 info}}
// 创建一个不可变的 EnumMap
Maps.immutableEnumMap(Map<K, ? extends V> map);

// 创建 LinkedHashMap
LinkedHashMap map = Maps.newLinkedHashMap();
LinkedHashMap map = Maps.newLinkedHashMap(Map<? extends K, ? extends V> map);
LinkedHashMap map = Maps.newLinkedHashMapWithExpectedSize(int expectedSize);

// 创建 TreeMap
TreeMap treeMap = Maps.newTreeMap();
TreeMap treeMap = Maps.newTreeMap(SortedMap<K, ? extends V> map);
TreeMap treeMap = Maps.newTreeMap(@Nullable Comparator<C> comparator);

// asMap -> set 集合按照 key 值转变成 map 集合, asMap 之后不可添加/修改元素，但可以移除/查看元素
Map<K, V> map = Maps.asMap(Set<K> set, Function<? super K, V> function);
SortedMap<K, V> map = Maps.asMap(SortedSet<K> set, Function<? super K, V> function);
NavigableMap<K, V> map = Maps.asMap(NavigableSet<K> set, Function<? super K, V> function);
Map<Integer, Integer> map = Maps.asMap(Sets.newLinkedHashSet(Ints.asList(4, 2, 3)), i -> i * 2); // {4=8, 2=4, 3=6}

// toMap 集合按照元素值转变成 map 集合，toMap 返回的是不可变集合，不支持增删改操作
ImmutableMap map = Maps.toMap(Iterable<K> keys, Function<? super K, V> valueFunction);
ImmutableMap map = Maps.toMap(Iterator<K> keys, Function<? super K, V> valueFunction)
ImmutableMap<Integer, String> map = Maps.toMap(Ints.asList(1, 2, 3), k -> k + "0"); // {1=10, 2=20, 3=30}

// uniqueIndex 与 toMap 互补，toMap 是以 key 生成 value，uniqueIndex 是以 value 生成 key, key 必须唯一
ImmutableMap map = Maps.uniqueIndex(Iterable<V> values, Function<? super V, K> keyFunction);
ImmutableMap map = Maps.uniqueIndex(Iterator<V> values, Function<? super V, K> keyFunction);
ImmutableMap<String, Integer> map = Maps.uniqueIndex(Ints.asList(1, 2, 3), i -> "0" + i); // {01=1, 02=2, 03=3}

// diffenence 比较两个集合元素的异同
ImmutableMap<String, Integer> leftMap = ImmutableMap.of("a", 1, "b", 2, "c",3);
ImmutableMap<String, Integer> rightMap = ImmutableMap.of("a", 2, "b", 2, "d",4);
MapDifference<String, Integer> diff = Maps.difference(leftMap, rightMap);
Map<String, Integer> onlyOnLeft = diff.entriesOnlyOnLeft(); // {c=3}
Map<String, Integer> onlyOnRight = diff.entriesOnlyOnRight(); // {d=4}
Map<String, Integer> inCommon = diff.entriesInCommon(); // {b=2}
Map<String, ValueDifference<Integer>> differing = diff.entriesDiffering(); // {a=(1, 2)}

// filterKeys 按 key 过滤 map
Map<K, V> filterKeys(Map<K, V> unfiltered, Predicate<? super K> keyPredicate);
SortedMap<K, V> filterKeys(SortedMap<K, V> unfiltered, Predicate<? super K> keyPredicate);
NavigableMap<K, V> filterKeys(NavigableMap<K, V> unfiltered, Predicate<? super K> keyPredicate);
BiMap<K, V> filterKeys(BiMap<K, V> unfiltered, Predicate<? super K> keyPredicate);
Maps.filterKeys(ImmutableMap.of("a", 1, "b", 2, "c", 3), key -> !key.equals("a")); // {b=2, c=3}

// filterValues 按 value 过滤 map
Map<K, V> filterValues(Map<K, V> unfiltered, Predicate<? super V> valuePredicate);
SortedMap<K, V> filterValues(SortedMap<K, V> unfiltered, Predicate<? super V> valuePredicate);
NavigableMap<K, V> filterValues(NavigableMap<K, V> unfiltered, Predicate<? super V> valuePredicate);
BiMap<K, V> filterValues(BiMap<K, V> unfiltered, Predicate<? super V> valuePredicate)
Maps.filterValues(ImmutableMap.of("a", 1, "b", 2, "c", 3), val -> val > 1); // {b=2, c=3}

// filterEntries 按照 entry 过滤 map
Map<K, V> filterEntries(Map<K, V> unfiltered, Predicate<? super Entry<K, V>> entryPredicate);
SortedMap<K, V> filterEntries(SortedMap<K, V> unfiltered, Predicate<? super Entry<K, V>> entryPredicate);
NavigableMap<K, V> filterEntries(NavigableMap<K, V> unfiltered, Predicate<? super Entry<K, V>> entryPredicate);
BiMap<K, V> filterEntries(BiMap<K, V> unfiltered, Predicate<? super Entry<K, V>> entryPredicate);
Maps.filterEntries(ImmutableMap.of("a", 1, "b", 2, "c", 3), entry -> !entry.getKey().equals("a") && entry.getValue() > 2); // {c=3}

// transformEntries 按 key 和 value 转换 map
Map<K, V2> transformEntries(Map<K, V1> fromMap, Maps.EntryTransformer<? super K, ? super V1, V2> transformer);
SortedMap<K, V2> transformEntries(SortedMap<K, V1> fromMap, Maps.EntryTransformer<? super K, ? super V1, V2> transformer);
NavigableMap<K, V2> transformEntries(NavigableMap<K, V1> fromMap, Maps.EntryTransformer<? super K, ? super V1, V2> transformer);
Map<Integer, Integer> fromMap = Maps.asMap(Sets.newLinkedHashSet(Ints.asList(4, 2, 3)), i -> i * 2);
Map<Integer, String> map = Maps.transformEntries(fromMap, (k, v) -> k + ":" + v);

// transformValues 按 value 转换 map
Map<K, V2> transformValues(Map<K, V1> fromMap, Function<? super V1, V2> function);
SortedMap<K, V2> transformValues(SortedMap<K, V1> fromMap, Function<? super V1, V2> function);
NavigableMap<K, V2> transformValues(NavigableMap<K, V1> fromMap, Function<? super V1, V2> function);
Map<Integer, Integer> fromMap = Maps.asMap(Sets.newLinkedHashSet(Ints.asList(4, 2, 3)), i -> i * 2);
Map<Integer, String> map = Maps.transformValues(fromMap, k -> k + "0"); // {4=80, 2=40, 3=60}

```



## Sets

不在整理，留在运用时理解记忆。



