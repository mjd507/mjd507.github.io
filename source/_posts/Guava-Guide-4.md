---
title: Guava 4 - Collections - 2 & range
categories: Java
toc: true
comments: true
copyright: true
date: 2018-06-19 15:37:40
tags:
visible:
---

Guava 新添了一些有用的集合类型，比如 Multiset，MultiMap，BiMap 等。

<!--more-->

## Multiset

Multiset 继承自 Collection，所以不是 set，List 有序可重复，Set 无序但不可重复，Multiset 介于 List 和 Set 之间，它无序但可重复，它有几个特性：

1. 看成无序的 ArrayList
   - add(E) 添加单个给定元素
   - iterator() 返回一个迭代器，包含 Multiset 的所有元素（包括重复的元素）
   - size()返回所有元素的总个数（包括重复的元素）
2. 看成 Map<E, Integer> ，键为元素，值为计数
   - count(Object) 返回给定元素的计数。HashMultiset.count 的复杂度为O(1)，TreeMultiset.count 的复杂度为 O(log n)
   - entrySet() 返回 Set<Multiset.Entry<E>>，和 Map 的 entrySet 类似
   - elementSet() 返回所有不重复元素的 Set<E>，和 Map 的 keySet() 类似
   - 所有 Multiset 实现的内存消耗随着不重复元素的个数线性增长。

```java
// Multiset 用来统计元素相当方便
HashMultiset<String> multiset = HashMultiset.create();
multiset.add("a");
multiset.add("b");
multiset.add("c");
multiset.add("a");
int count = multiset.count("a"); // 2
//multiset:  [a x 2, b, c]
```



## MultiMap

一般一个键对应多个值，采用 Map<K, List<V>> 这种结构，guava 使用 MultiMap 简化了这种结构。

```java
// 一般存储 Map<K, List<V>> 写法
Map<String,List<String>> map = new HashMap<>();
void putList(String key, String value) {
  List<String> list = map.get(key);
  if (list == null) {
    list = new ArrayList<>();
    map.put(key, list);
  }
  list.add(value);
}
// guava 提供了 MultiMap，写法更加简洁
ArrayListMultimap<String, String> multimap = ArrayListMultimap.create();
multimap.put("a","1");
multimap.put("a","2");
multimap.put("a","3");
multimap.put("b","1");
//multimap: {a=[1, 2, 3], b=[1]}

// asMap 将 Multimap<K, V> 映射成 Map<K, Collection<V>>，转换后只支持 remove 和 修改操作，不支持添加
Map<String, Collection<String>> map = multimap.asMap();
// map.put("c", Lists.newArrayList()); // UnsupportedOperationException
map.remove("a"); // {b=[1]}

// MultiMap.get(key) 一定返回一个非 null 的集合, 通过 asMap() 转换后，get(key) 可以返回 null 值
// Multimap.entries() 返回的是 Multimap 所有的键值对。如需 key-collection 的键值对，可用 asMap().entries()
// Multimap.size() 返回的是 entries 的数量。如果要不重复键的 size就得用 Multimap.keySet().size()
```



## BiMap

BiMap 是键和值都唯一的 map，不但适合以 key 查找 value，而且适合以 value 查找 key。

```java
// 假设 userId 与 userName 是一一对应的关系
// 一般做法, 只能根据 userId 找 userName，若要反查，则需要遍历
HashMap<Integer, String> hashMap = Maps.newHashMap();
hashMap.put(1, "guy");
hashMap.put(2, "kai");

// guava 提供了 BiMap，在添加时就限制了 value 的唯一性
HashBiMap<Integer, String> biMap = HashBiMap.create();
biMap.put(1, "guy");
biMap.put(2, "kai");
BiMap<String, Integer> inverseMap = biMap.inverse();
// {guy=1, kai=2}

// inverse 方法会返回一个反转的 BiMap，这个反转的 map 不是新的 map 对象，它实现了一种视图关联，对反转后的 map 的所有操作都会影响原先的 map 对象。
inverseMap.put("abc", 3);
// biMap : {1=guy, 2=kai, 3=abc}
// inverseMap: {guy=1, kai=2, abc=3}
```

此外还有 Table，ClassToInstanceMap，RangeSet，RangeMap 等新增功能性集合，不再整理。



## Range

guava 提供了 Range 区间运算，这里更推荐使用 JDK 8 的 range 配合 stream。

```java
// range是半开区间，左闭右开
// [1，10) 中每个元素 乘以 2
range(1, 10).map(i -> i * 2).toArray(); // [2, 4, 6, 8, 10, 12, 14, 16, 18]
range(1, 10).map(i -> i * 2).boxed().collect(toList()); // [2, 4, 6, 8, 10, 12, 14, 16, 18]

// [1，100] 求和
range(1, 101).sum();  // 5050
range(1, 101).reduce(0, Integer::sum);  // 5050
Stream.iterate(0, i -> i + 1).limit(101).reduce(0, Integer::sum);  // 5050
IntStream.iterate(0, i -> i + 1).limit(101).reduce(0, Integer::sum);  // 5050

```

