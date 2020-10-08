---
title: Guava 2 - Primitives, Strings & Cache
categories: Java & Android
toc: true
comments: true
copyright: true
date: 2018-05-17 09:12:42
tags:
visible:
---

Guava 对基本数据类型常用的操作进行了封装，命名也很好记，Int 类型的封装类取之为 Ints，long 类型的封装类取名为 Longs。

<!--more-->

## 原始类型常用方法

```java
// ------------------------------- 以 Ints 为例--------------------------------- //
Ints.min(int... array); Ints.max(int... array) // 返回最小/大数
Ints.concat(int[]... arrays) // 合并多个数组
Ints.reverse(int[] array) // 反转数组元素
Ints.toArray(Collection<? extends Number> collection) // 转换为数组
Ints.asList(int... backingArray) // 转换为集合
Ints.contains(int[] array, int target) // 是否包含子元素
Ints.indexOf(int[] array, int[] target) // 子数组角标
Ints.join(String separator, int... array) // 以特定分隔符连接 int 数组
```

------

## 字符串相关

```java
// ------------------------------- Strings --------------------------------- //
String nullToEmpty(@Nullable String string);
String emptyToNull(@Nullable String string);
boolean isNullOrEmpty(@Nullable String string);
padStart(String string, int minLength, char padChar);//串头填充 padStart("7", 3, '0') => "007"
padEnd(String string, int minLength, char padChar); //串尾填充 padEnd("4.", 5, '0') => "4.000"
repeat(String string, int count);// repeat("hey", 3) => "heyheyhey"
commonPrefix(CharSequence a, CharSequence b); //共同前缀
commonSuffix(CharSequence a, CharSequence b); //公共后缀
```

### Joiner

```java
// ------------------------------- Joiner --------------------------------- //
// 一般连接字符串，过滤 null 的做法
public String join(List<Integer> list, String separator) {
  StringBuilder builder = new StringBuilder();
  list.forEach(item->builder.append(item).append(separator));
  builder.setLength(builder.length() - 1);
  return builder.toString();
}
// guava 提供了 Joiner ，链式操作，并且可跳过 null
Joiner joiner = Joiner.on("; ").skipNulls();
return joiner.join("Harry", null, "Ron", "Hermione"); // "Harry; Ron; Hermione".

Joiner.on(",").join(Arrays.asList(1, 5, 7)); // "1,5,7"

Joiner.on("&").withKeyValueSeparator("=").join(ImmutableMap.of("id", "1", "name", "kotlin")); // id=1&name=kotlin  常用于 http get 请求参数的拼接
```

### Splitter

```java
// ------------------------------- Splitter --------------------------------- //
// 针对 JDK 内建的字符串拆分工具有一些古怪的特性, 比如会忽略尾部的空字符串 
",a,,b,".split(","); // 返回 "","a","","b"

//  guava 提供了 Splitter ，链式操作，并且可过滤空串
Splitter.on(",").trimResults().omitEmptyStrings().split("foo,bar,,   qux"); // [foo, bar, qux]

Splitter.on("&").withKeyValueSeparator("=").split("id=1&name=kotlin"); // {id=1, name=kotlin} 常用于 url 参数的解析
```

------

## 缓存

guava 提供了缓存功能，是本地内存缓存，与 Redis 等分布式缓存不同，guava cache 只适用于单个应用运行时的数据存取，一般的像用户登录相关的 token ，userInfo 等频繁访问的接口数据，就可以使用缓存。

- guava 缓存不是一整个全局缓存，你可以为某个具体的业务模块单独定义全局缓存
- guava 提供了五大类缓存回收策略，按缓存数目，按缓存权重，按时间回收，按引用回收，显式手动清除
- guava 提供了缓存统计功能，可统计每类缓存的命中率等数据。

```java
// 项目里可以定义一个抽象缓存，用来配置 guava 的 CacheBuilder
//------------------------- AbsLoadingCache<K,V> --------------------------//
public LoadingCache<K, V> getLoadingCache() {
  if (loadingCache == null) {
    synchronized (this) {
      if (loadingCache == null) {
        loadingCache = CacheBuilder.newBuilder()
          .maximumSize(maxSize) // 1000 条缓存
          .expireAfterAccess(expireAfterAccessDuration, timeUnit) //数据缓存时间
          .recordStats() // 启用统计
          .removalListener(removalNotification -> {
            // logger.warn("Guava LocalCache Removed Key: {}, Value: {}, Cause:{}",
            // removalNotification.getKey(), removalNotification.getValue(),
            // removalNotification.getCause());
          }).build(new CacheLoader<K, V>() {
          @Override
          public V load(K key) {
            return fetchValue(key);
          }
        });
      }
    }
  }
  return loadingCache;
}
/**
 * 根据 key 从数据库或其他数据源中获取 value，该 value 会自动保存到缓存中
 */
public abstract V fetchValue(K key);
// 获取缓存
public V getCacheValue(K key) {
  V result = null;
  try {
    result = getLoadingCache().get(key);
    if (getLoadingCache().size() > highestSize) {
      highestSize = getLoadingCache().size();
      highestTime = new Date();
    }
  } catch (Exception e) {
    logger.warn("guava 获取缓存异常：{}", e.getMessage());
  }
  return result;
}
// 刷新缓存
public void refreshCacheValue(K key) {
  this.getLoadingCache().refresh(key);
}

//------------------------- TokenCache --------------------------//
// 假设要缓存登录 token 对应的信息，可以定义一个 TokenCache，继承 AbsLoadingCache
@Component
public class TokenCache extends AbsLoadingCache<String, LoginDo> {
  
  public TokenCache() {
    setMaximumSize(1000);
    setExpireAfterAccessDuration(2);
    setTimeUnit(TimeUnit.DAYS);
  }
  
  @Autowired
  LoginServiceMapper loginMapper;

  @Override
  public LoginDo fetchValue(String key) {
    return loginMapper.findByToken(key);
  }
}

//------------------------- LoginServiceImpl --------------------------//
// 每次请求根据 token 获取 userId 时，就可以从缓存获取
@Autowired
TokenCache tokenCache;
public LoginDto findValidByToken(String token) {
  LoginDo loginDo = tokenCache.getCacheValue(token);
  // LoginDo loginDo = loginMapper.findByToken(token);
  if (loginDo == null) {
    return null;
  }
  boolean isExpired = DateUtils.isExpired(loginDo.getExpiredAt(), 0);
  if (isExpired) {
    // 自动刷新 token 时效
    loginDo.setExpiredAt(DateUtils.getDayFromNow(30));
    loginMapper.refreshToken(loginDo);
  }
  return CopyUtils.copyObject(loginDo, LoginDto.class);
}

// 缓存用户信息可以采取 TokenCache 一样的做法，在定义一个 CacheBuilder。
// 统计功能，可以找出程序内所有继承了 AbsLoadingCache 的子类，将 LoadingCache 以及 其中的 CacheStats 相关数据收集起来。
```

