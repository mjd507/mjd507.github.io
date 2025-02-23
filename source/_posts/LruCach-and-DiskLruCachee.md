---
title: Android 中 Lru 缓存算法分析
categories: Big-Back-End
toc: true
comments: true
date: 2016-12-14 15:09:19
tags:
---

Android 项目设计到大量 图片，文件时，都会使用到缓存技术，一般项目框架都会帮助我们封装好，我们只需要指定具体的缓存策略就可以了；缓存的策略或者说算法有很多种，比如 FIFO，FILO，LRU 等，本文主要分析一下 LruCache 以及 DiskLruCache。LruCache 在 Android 3.1 之后就出现在 Android 源码中了，DiskLruCache 得到官方推荐，但还未出现在源码里。[查看 DiskLruCache.java 源码](https://developer.android.com/samples/DisplayingBitmaps/src/com.example.android.displayingbitmaps/util/DiskLruCache.html)，另外，JakeWharton 也有一份 [DiskLruCache](https://github.com/JakeWharton/DiskLruCache)，可以看看。

<!--more-->

再看 LruCache 源码之前，有必要先了解一下这个类：LinkedHashMap。LruCache 内部就是使用这个 map 来维护缓存数据的。

## LinkedHashMap
先看一个小栗子
```java
	HashMap<String, String> hashMap = new HashMap<>();
	hashMap.put("021", "shanghai");
	hashMap.put("0512", "suzhou");
	hashMap.put("010", "beijing");

	System.out.println(hashMap);
	
	LinkedHashMap<String, String> linkedHashMap = new LinkedHashMap<>();
	linkedHashMap.put("021", "shanghai");
	linkedHashMap.put("0512", "suzhou");
	linkedHashMap.put("010", "beijing");

	System.out.println(linkedHashMap);
```
运行结果：
```java
{0512=suzhou, 021=shanghai, 010=beijing}
{021=shanghai, 0512=suzhou, 010=beijing}
```
通过结果也可以猜到，LinkedHashMap 对内部存储的关系映射数据是有序的。我们看下它的源码，先看它内部的静态类 LinkedEntry ：
```java
    /**
     * LinkedEntry adds nxt/prv double-links to plain HashMapEntry.
     */
    static class LinkedEntry<K, V> extends HashMapEntry<K, V> {
        LinkedEntry<K, V> nxt;
        LinkedEntry<K, V> prv;

        /** Create the header entry */
        LinkedEntry() {
            super(null, null, 0, null);
            nxt = prv = this;
        }

        /** Create a normal entry */
        LinkedEntry(K key, V value, int hash, HashMapEntry<K, V> next,
                    LinkedEntry<K, V> nxt, LinkedEntry<K, V> prv) {
            super(key, value, hash, next);
            this.nxt = nxt;
            this.prv = prv;
        }
    }

```
这里，LinkedEntry 继承了 HashMapEntry，该 Entry 除了保存当前对象的引用外，还同时增加了两个 Entry，prv、nxt 来保存对前一个 和 后一个元素的引用。我们先看它存储数据的方法 : 
```java
    @Override 
    void addNewEntry(K key, V value, int hash, int index) {
        LinkedEntry<K, V> header = this.header;

        // Remove eldest entry if instructed to do so.
        LinkedEntry<K, V> eldest = header.nxt;
        if (eldest != header && removeEldestEntry(eldest)) {
            remove(eldest.key);
        }

        // Create new entry, link it on to list, and put it into table
        LinkedEntry<K, V> oldTail = header.prv;
        LinkedEntry<K, V> newTail = new LinkedEntry<K,V>(
                key, value, hash, table[index], header, oldTail);
        table[index] = oldTail.nxt = header.prv = newTail;
```
LinkedHashMap 里没有重写 put 方法，而是重写了 HashMap 的 put 方法调用的子方法 addNewEntry，提供了自己特有的双向链接列表的实现。再看下读取数据的方法：
```java
    @Override 
    public V get(Object key) {
        /*
         * This method is overridden to eliminate the need for a polymorphic
         * invocation in superclass at the expense of code duplication.
         */
        if (key == null) {
            HashMapEntry<K, V> e = entryForNullKey;
            if (e == null)
                return null;
            if (accessOrder)
                makeTail((LinkedEntry<K, V>) e);
            return e.value;
        }

        // Replace with Collections.secondaryHash when the VM is fast enough (http://b/8290590).
        int hash = secondaryHash(key);
        HashMapEntry<K, V>[] tab = table;
        for (HashMapEntry<K, V> e = tab[hash & (tab.length - 1)];
                e != null; e = e.next) {
            K eKey = e.key;
            if (eKey == key || (e.hash == hash && key.equals(eKey))) {
                if (accessOrder)
                    makeTail((LinkedEntry<K, V>) e);
                return e.value;
            }
        }
        return null;
    }

```
这里面有一个 accessOrder，它是一个 布尔值，true 代表按访问顺序排，false 代表按插入顺序排，默认为 false，在构造函数里可以看到。如果打算按访问顺序（最先访问的在最前面）来保存元素，那么可以用它另一个构造方法：
```java
    public LinkedHashMap() {
        init();
        accessOrder = false;
    }

    public LinkedHashMap(int initialCapacity, float loadFactor, boolean accessOrder) {
        super(initialCapacity, loadFactor);
        init();
        this.accessOrder = accessOrder;
    }

    @Override void init() {
        header = new LinkedEntry<K, V>();
    }

```
accessOrder 就为实现 Lru 算法的实现铺好了路。Lru 算法 ： 最少最近使用的对象，正好是基于访问顺序，利用 accessOrder 这一属性就非常简单了，下面就来看看 Lru 算法的实现。


## LruCache 
先看构造方法：
```java
    public LruCache(int maxSize) {
        if (maxSize <= 0) {
            throw new IllegalArgumentException("maxSize <= 0");
        }
        this.maxSize = maxSize;
        this.map = new LinkedHashMap<K, V>(0, 0.75f, true);
    }

```
这里使用 LruCache 需提供一个缓存的最大的 size，当超过这个 size 就回收；另外，构造了一个 LinkedHashMap，accessOrder 传的值为 true，果然是按访问顺序排序。
LruCache 存储和读取的方法都是调用 LinkedHashMap 的方法，这里就不贴了。我们一般使用如下方法来构建一个 LruCache：
```java
    int cacheSize = 4 * 1024 * 1024; // 4MiB
    LruCache<String, Bitmap> bitmapCache = new LruCache<String, Bitmap>(cacheSize) {
        protected int sizeOf(String key, Bitmap value) {
            return value.getByteCount();
        }
    }

```

## DiskLruCache
创建 DiskLruCache：DiskLruCache 构造方法被私有化了，并提供了 open 方法来创建自身。该方法有四个参数，第一个是存储目录，可以选择 SD 卡上的缓存目录，如果想要应用卸载后，此目录数据一并删除，可以这样指定 /sdcard/Android/data/package_name/cache. 第二个参数是应用版本号，一般设为 1，当版本号发生改变时，会清除之前的缓存文件，但实际开发中作用不大，很多情况即使版本号改变了，之前的缓存还在，所以一般设为 1，第三个参数表示单个节点对应的数据的个数，一般也设为 1，第四个参数表示表示缓存的总大小。
```java
    public static DiskLruCache open(File directory, int appVersion, int valueCount, long maxSize)
            throws IOException {
        if (maxSize <= 0) {
            throw new IllegalArgumentException("maxSize <= 0");
        }
        if (valueCount <= 0) {
            throw new IllegalArgumentException("valueCount <= 0");
        }
 
        // prefer to pick up where we left off
        DiskLruCache cache = new DiskLruCache(directory, appVersion, valueCount, maxSize);
        if (cache.journalFile.exists()) {
            try {
                cache.readJournal();
                cache.processJournal();
                cache.journalWriter = new BufferedWriter(new FileWriter(cache.journalFile, true),
                        IO_BUFFER_SIZE);
                return cache;
            } catch (IOException journalIsCorrupt) {
//                System.logW("DiskLruCache " + directory + " is corrupt: "
//                        + journalIsCorrupt.getMessage() + ", removing");
                cache.delete();
            }
        }
 
        // create a new empty cache
        directory.mkdirs();
        cache = new DiskLruCache(directory, appVersion, valueCount, maxSize);
        cache.rebuildJournal();
        return cache;
    }
```
DiskLruCache 在缓存对象的时候，如果 key 是一个 url，最好先用 key 的 md5 值作为新的 key 去缓存，主要是为了避免 url 中的特殊字符的影响。有了 key 之后，通过 edit(key) 方法获取一个 Editor 对象，在通过 这个 Editor 获得输出流，我们从网络下载文件时直接将获得的输入流写到这个 输出流当中，在通过 editor.commit() 方法将流写入文件系统，看下代码：
```java
        String key = MD5Utils.getMd5Str(url.getBytes());
        DiskLruCache.Editor editor = mDiskLrucache.edit(key);
        if (editor != null) {
            OutputStream outputStream = editor.newOutputStream(0);
            if (downloadUrlToStream(url, outputStream)) {
                editor.commit();
            } else {
                editor.abort();
            }
            mDiskLrucache.flush();
        }


    private boolean downloadUrlToStream(String url, OutputStream outputStream) {
        URL urlStr = null;
        HttpURLConnection conn = null;
        BufferedOutputStream out = null;
        BufferedInputStream in = null;
        try {
            urlStr = new URL(url);
            conn = (HttpURLConnection) urlStr.openConnection();
            out = new BufferedOutputStream(outputStream);
            in = new BufferedInputStream(conn.getInputStream());
            int b;
            while ((b = in.read()) != -1) {
                out.write(b);
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
            CloseUtils.closeIO(in, out);
        }
        return false;
    }
```
这样一来，下次再获取该文件就不要走网络请求了。 DiskLruCache 缓存的查找和添加过程类似，首先 通过 get(key) 方法获取一个 Snapshot 对象，通过它获取到文件的输入流，有了 输入流，如果是一个图片，就可以通过 BitmapFactory.decodeStream() 来获取到 bitmap 对象了。但为了避免 oom，需要对图片进行压缩处理，这里有一个问题，FileInputStream 是一种有序的文件流，如果 decodeStream 两次，会影响文件流的位置属性，导致第二次 decodeStream 时，返回的是 null。解决办法是通过文件流得到对应的文件描述，然后通过 BitmapFactory.decodeFileDescriptor 来加载一张缩略图。
```java

    private Bitmap get(String url,int reqWidth,int reqHeight) throws IOException {
        Bitmap bitmap = null;
        String key = MD5Utils.getMd5Str(url.getBytes());
        DiskLruCache.Snapshot snapshot = mDiskLrucache.get(key);
        if(snapshot!=null){
            FileInputStream fis = (FileInputStream) snapshot.getInputStream(0);
            FileDescriptor fileDescriptor = fis.getFD();
            bitmap = ImageResizer.decodeSampledBitmapFromDescriptor(fileDescriptor, reqWidth, reqHeight);
            //add to memory
        }
        return bitmap;
    }

```
到这里，应该对 DiskLruCache 如何使用有了一个了解。


## 非常棒的文章
[LinkedHashMap的实现原理](http://zhangshixi.iteye.com/blog/673789)
[Android DiskLruCache完全解析，硬盘缓存的最佳方案](http://blog.csdn.net/guolin_blog/article/details/28863651)


