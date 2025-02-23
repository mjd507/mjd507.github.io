---
title: redis 2.2 源码阅读
categories: Big-Back-End
toc: true
comments: true
copyright: true
visible: true
date: 2020-10-03 19:46:11
tags:
---

在 redis 的 Github 仓库中，2.2 分支是可追溯的最早的一个版本，发布于 2011 年 10 月，其 src 目中，只有 65 个文件，24136 行代码。对于学习而言，非常友好。

<!--more-->


题外话，对于任何中间件的学习，比如 redis, zookeeper, kafka, 无外乎这么几个方面：数据如何存储，数据一致性如何保证，集群/客户端如何通信等。

在阅读时，可以有意的往这几个方面靠，从而抽象出共性。


## 学习大纲

此处搜刮了网络上各路大佬们对 redis 的源码的阅读建议，整理而来，主要分为以下几个部分。

1. 数据结构底层实现

    | 结构       | 文件                                                           |
    | :---:      | :---:                                                          |
    | 动态字符串 | sds.c / sds.h                                                  |
    | 双端链表   | adlist.c / adlist.h                                            |
    | 字典       | dict.c / dict.h                                                |
    | 跳表       | redis.h 中的 zskiplist、<br />t_zset.c 中所有以 zsl 开头的函数 |

2. redis 定制的内存编码实现

    | 内存编码 | 文件                  |
    | :-----:  | :----:                |
    | 整数集合 | intset.c / intset.h   |
    | 压缩列表 | ziplist.c / ziplist.h |

3. 数据结构上层实现
    
    | 结构     | 文件       |
    | :---:    | :---:      |
    | 对象     | object.c   |
    | 字符串   | t_string.c |
    | 列表     | t_list.c   |
    | 散列表   | t_hash.c   |
    | 集合     | t_set.c    |
    | 有序集合 | t_zset.c   |

4. 数据库相关

    | 描述     | 文件                       |
    | :-----:  | :----:                     |
    | 数据库   | redis.h 中的 redisDb, db.c |
    | 数据通知 | notify.c                   |
    | rdb      | rdb.c / rdb.h              |
    | aof      | aof.c                      |

5. 网络通信相关

    | 描述       | 文件                                    |
    | :-----:    | :----:                                  |
    | 事件处理器 | ae.c, ae_*.c                            |
    | 网络连接库 | networking.c                            |
    | 单机 redis | redis.c / redis.h 单机 redis 服务器相关 |

## 1. 底层数据结构

**动态字符串**

Simple Dynamic Strings (sds)，redis 字符串相关实现在 sds.c 文件中, 可参考 https://github.com/antirez/sds 实现。

在 sds.h 头文件中，定义了 sds, sdshdr, 以及字符串相关函数，其中 sdshdr 包含了字符串的相关信息。
``` c
typedef char *sds; // 自定义了字符指针 sds

struct sdshdr {
    int len; // 字符串真实的长度
    int free; // 剩余可用长度
    char buf[]; // 存放真实的字符串
};
```

sds.c 文件中，实现了字符串操作相关方法，我们来看 sdsnewlen 函数, 即创建一个 redis 字符串
```c
sds sdsnewlen(const void *init, size_t initlen) {
    struct sdshdr *sh;

    sh = zmalloc(sizeof(struct sdshdr)+initlen+1);
#ifdef SDS_ABORT_ON_OOM
    if (sh == NULL) sdsOomAbort();
#else
    if (sh == NULL) return NULL;
#endif
    sh->len = initlen;
    sh->free = 0;
    if (initlen) {
        if (init) memcpy(sh->buf, init, initlen);
        else memset(sh->buf,0,initlen);
    }
    sh->buf[initlen] = '\0';
    return (char*)sh->buf;
}
```
注意其返回值，为字符串指针。这里有一个彩蛋。

假设我们创建一个字符串
```c
sdsnewlen("redis", 5);
```

那么将会创建一个 sdshdr 结构体，并为其中的 len, free, buf 字段分配内存
```c
sh = zmalloc(sizeof(struct sdshdr)+initlen+1); // sizeof(struct sdshdr)  为两个 int 变量 size，initlen+1 为字符串 size 
```

创建成功后，内存里大致如下
```
-----------
|5|0|redis|
-----------
^   ^
sh  sh->buf
```

因返回值为 sh->buf，那么假如我们要获取 sh 指针，该怎么办？

想要 sh 指针，但只有 sh->buf, 那么可以从 sh->buf 拿到 sh 吗？

可以，用指针算法来求，因为地址连续，我们可以从 sh->buf 地址减去两个 int 的大小，从而得到 sh 指针位置。

而两个 int 的大小正好是 sdshdr 结构体的 size 。

可以看下 sdslen 函数实现，正是利用了这个指针计算来拿到 sh 指针，从而获取 len 。 

```c
size_t sdslen(const sds s) {
    struct sdshdr *sh = (void*) (s-(sizeof(struct sdshdr)));
    return sh->len;
}
```

思考：为什么 redis 要自定义 sds 而不是 c 语言标准的 string ？

**双端链表**

A generic doubly linked list (adlist)， redis 双端链表相关实现在 adlist.c 文件中。

在 adlist.h 头文件中，定义了链表，链表节点和迭代器，以及链表相关方法
```c
/* Node, List, and Iterator are the only data structures used currently. */

typedef struct listNode {
    struct listNode *prev;
    struct listNode *next;
    void *value;
} listNode;

typedef struct listIter {
    listNode *next;
    int direction;
} listIter;

typedef struct list {
    listNode *head;
    listNode *tail;
    void *(*dup)(void *ptr);
    void (*free)(void *ptr);
    int (*match)(void *ptr, void *key);
    unsigned int len;
} list;

```

在 adlist.c 文件中，实现了链表相关的方法，来看下在链表头部添加元素
```c
/* Add a new node to the list, to head, contaning the specified 'value'
 * pointer as value.
 *
 * On error, NULL is returned and no operation is performed (i.e. the
 * list remains unaltered).
 * On success the 'list' pointer you pass to the function is returned. */
list *listAddNodeHead(list *list, void *value)
{
    listNode *node;

    if ((node = zmalloc(sizeof(*node))) == NULL)
        return NULL;
    node->value = value;
    if (list->len == 0) {
        list->head = list->tail = node;
        node->prev = node->next = NULL;
    } else {
        node->prev = NULL;
        node->next = list->head;
        list->head->prev = node;
        list->head = node;
    }
    list->len++;
    return list;
}
```
标准的链表操作，有没有很熟悉。

**字典**

redis hash table 相关结构在 dict.c 文件中。

先来看下 dict.h 中定义的结构
```c
typedef struct dictEntry {
    void *key;
    void *val;
    struct dictEntry *next;
} dictEntry;

/* This is our hash table structure. Every dictionary has two of this as we
 * implement incremental rehashing, for the old to the new table. */
typedef struct dictht {
    dictEntry **table;
    unsigned long size;
    unsigned long sizemask;
    unsigned long used;
} dictht;

/* If safe is set to 1 this is a safe iteartor, that means, you can call
 * dictAdd, dictFind, and other functions against the dictionary even while
 * iterating. Otherwise it is a non safe iterator, and only dictNext()
 * should be called while iterating. */
typedef struct dictIterator {
    dict *d;
    int table, index, safe;
    dictEntry *entry, *nextEntry;
} dictIterator;

```
dictht 上注释提示了，每个字典都有两个 dictht ，用来当数据增长时 rehashing 使用。

关注一下 dict.c 文件中几种 hash 函数
```c
/* Thomas Wang's 32 bit Mix Function */
unsigned int dictIntHashFunction(unsigned int key)
{
    key += ~(key << 15);
    key ^=  (key >> 10);
    key +=  (key << 3);
    key ^=  (key >> 6);
    key += ~(key << 11);
    key ^=  (key >> 16);
    return key;
}

/* Identity hash function for integer keys */
unsigned int dictIdentityHashFunction(unsigned int key)
{
    return key;
}

/* Generic hash function (a popular one from Bernstein).
 * I tested a few and this was the best. */
unsigned int dictGenHashFunction(const unsigned char *buf, int len) {
    unsigned int hash = 5381;

    while (len--)
        hash = ((hash << 5) + hash) + (*buf++); /* hash * 33 + c */
    return hash;
}

/* And a case insensitive version */
unsigned int dictGenCaseHashFunction(const unsigned char *buf, int len) {
    unsigned int hash = 5381;

    while (len--)
        hash = ((hash << 5) + hash) + (tolower(*buf++)); /* hash * 33 + c */
    return hash;
}
```

**跳表**

redis.h 中定义了跳表结构
```c
/* ZSETs use a specialized version of Skiplists */
typedef struct zskiplistNode {
    robj *obj;
    double score;
    struct zskiplistNode *backward;
    struct zskiplistLevel {
        struct zskiplistNode *forward;
        unsigned int span;
    } level[];
} zskiplistNode;

typedef struct zskiplist {
    struct zskiplistNode *header, *tail;
    unsigned long length;
    int level;
} zskiplist;

typedef struct zset {
    dict *dict;
    zskiplist *zsl;
} zset;
```

t_zset.c 中跳表的创建
```c
zskiplist *zslCreate(void) {
    int j;
    zskiplist *zsl;

    zsl = zmalloc(sizeof(*zsl));
    zsl->level = 1;
    zsl->length = 0;
    zsl->header = zslCreateNode(ZSKIPLIST_MAXLEVEL,0,NULL);
    for (j = 0; j < ZSKIPLIST_MAXLEVEL; j++) {
        zsl->header->level[j].forward = NULL;
        zsl->header->level[j].span = 0;
    }
    zsl->header->backward = NULL;
    zsl->tail = NULL;
    return zsl;
}

```

以上简单过了一下 redis 底层数据结构，这些数据结构为上层使用封装提供了有力支持。


## 2. 定制内存编码

以上数据结构属于通用知识，任何语言都有此类数据结构支持，而内存编码部分，是 redis 为节约内存使用专门开发出来，比较独立，专门拎出来，加深点印象。

**intset**

当 set 集合全为 int 类型，并且数量不多（小于 set-max-intset-entries）时，底层采用 intset 结构，否则采用 dict .

当采用 intset 时，也有 2 个字节，4 个字节，8 个字节等不同选择，根据 int 值的大小自动调整。

```c
typedef struct intset {
    uint32_t encoding;
    uint32_t length;
    int8_t contents[];
} intset;
```

```c
#define INTSET_ENC_INT16 (sizeof(int16_t))
#define INTSET_ENC_INT32 (sizeof(int32_t))
#define INTSET_ENC_INT64 (sizeof(int64_t))
```

**ziplist**

ziplist 是为了提高存储效率而设计的一个双向链表。可以用于存储字符串或整数，其中整数是按真正的二进制表示进行编码的，而不是编码成字符串序列。它能以 O(1) 的时间复杂度在表的两端提供 push 和 pop 操作。

普通的双向链表，链表中每一项都占用独立的一块内存，各项之间用地址指针（或引用）连接起来, 会带来大量的内存碎片，而且指针也会占用内存。ziplist 是将链表中每一项存放在前后连续的地址空间内，所以它是一块完整的内存。

ziplist 内部布局，这一块是其设计核心，比较繁琐，好早每一块都有介绍，推荐看下源码描述。
```c
<zlbytes><zltail><zllen><entry><entry><zlend>
```


## 3. 上层数据结构

**object.c**

我们设置五种类型 string, list, set, sorted set, hash 的 key, value 时，实际上 redis 是用一个个 redis object 来接受 kv，object.c 主要实现了对象的创建、引用计数和释放，字符串对象的编码转换。

redisObject 定义
```c
typedef struct redisObject {
    unsigned type:4;
    unsigned storage:2;     /* REDIS_VM_MEMORY or REDIS_VM_SWAPPING */
    unsigned encoding:4;
    unsigned lru:22;        /* lru time (relative to server.lruclock) */
    int refcount;
    void *ptr;
    /* VM fields are only allocated if VM is active, otherwise the
     * object allocation function will just allocate
     * sizeof(redisObjct) minus sizeof(redisObjectVM), so using
     * Redis without VM active will not have any overhead. */
} robj;
```

对象类型定义
```c
/* Object types */
#define REDIS_STRING 0
#define REDIS_LIST 1
#define REDIS_SET 2
#define REDIS_ZSET 3
#define REDIS_HASH 4
#define REDIS_VMPOINTER 8
```

对象编码定义
```c
/* Objects encoding. Some kind of objects like Strings and Hashes can be
 * internally represented in multiple ways. The 'encoding' field of the object
 * is set to one of this fields for this object. */
#define REDIS_ENCODING_RAW 0     /* Raw representation */
#define REDIS_ENCODING_INT 1     /* Encoded as integer */
#define REDIS_ENCODING_HT 2      /* Encoded as hash table */
#define REDIS_ENCODING_ZIPMAP 3  /* Encoded as zipmap */
#define REDIS_ENCODING_LINKEDLIST 4 /* Encoded as regular linked list */
#define REDIS_ENCODING_ZIPLIST 5 /* Encoded as ziplist */
#define REDIS_ENCODING_INTSET 6  /* Encoded as intset */
#define REDIS_ENCODING_SKIPLIST 7  /* Encoded as skiplist */
```

对象的创建，五种类型的对象的创建都是基于此方法
```c
robj *createObject(int type, void *ptr) {
    robj *o = zmalloc(sizeof(*o));
    o->type = type;
    o->encoding = REDIS_ENCODING_RAW;
    o->ptr = ptr;
    o->refcount = 1;

    /* Set the LRU to the current lruclock (minutes resolution).
     * We do this regardless of the fact VM is active as LRU is also
     * used for the maxmemory directive when Redis is used as cache.
     *
     * Note that this code may run in the context of an I/O thread
     * and accessing server.lruclock in theory is an error
     * (no locks). But in practice this is safe, and even if we read
     * garbage Redis will not fail. */
    o->lru = server.lruclock;
    /* The following is only needed if VM is active, but since the conditional
     * is probably more costly than initializing the field it's better to
     * have every field properly initialized anyway. */
    o->storage = REDIS_VM_MEMORY;
    return o;
}
```

**t_string.c**

字符串设置相关操作
```c
void setGenericCommand(redisClient *c, int nx, robj *key, robj *val, robj *expire) {
    int retval;
    long seconds = 0; /* initialized to avoid an harmness warning */

    if (expire) {
        if (getLongFromObjectOrReply(c, expire, &seconds, NULL) != REDIS_OK)
            return;
        if (seconds <= 0) {
            addReplyError(c,"invalid expire time in SETEX");
            return;
        }
    }

    lookupKeyWrite(c->db,key); /* Force expire of old key if needed */
    retval = dbAdd(c->db,key,val);
    if (retval == REDIS_ERR) {
        if (!nx) {
            dbReplace(c->db,key,val);
            incrRefCount(val);
        } else {
            addReply(c,shared.czero);
            return;
        }
    } else {
        incrRefCount(val);
    }
    touchWatchedKey(c->db,key);
    server.dirty++;
    removeExpire(c->db,key);
    if (expire) setExpire(c->db,key,time(NULL)+seconds);
    addReply(c, nx ? shared.cone : shared.ok);
}
```

**t_list.c**

链表相关API
```c
void listTypePush(robj *subject, robj *value, int where) {
    /* Check if we need to convert the ziplist */
    listTypeTryConversion(subject,value);
    if (subject->encoding == REDIS_ENCODING_ZIPLIST &&
        ziplistLen(subject->ptr) >= server.list_max_ziplist_entries)
            listTypeConvert(subject,REDIS_ENCODING_LINKEDLIST);

    if (subject->encoding == REDIS_ENCODING_ZIPLIST) {
        int pos = (where == REDIS_HEAD) ? ZIPLIST_HEAD : ZIPLIST_TAIL;
        value = getDecodedObject(value);
        subject->ptr = ziplistPush(subject->ptr,value->ptr,sdslen(value->ptr),pos);
        decrRefCount(value);
    } else if (subject->encoding == REDIS_ENCODING_LINKEDLIST) {
        if (where == REDIS_HEAD) {
            listAddNodeHead(subject->ptr,value);
        } else {
            listAddNodeTail(subject->ptr,value);
        }
        incrRefCount(value);
    } else {
        redisPanic("Unknown list encoding");
    }
}

robj *listTypePop(robj *subject, int where) {
    robj *value = NULL;
    if (subject->encoding == REDIS_ENCODING_ZIPLIST) {
        unsigned char *p;
        unsigned char *vstr;
        unsigned int vlen;
        long long vlong;
        int pos = (where == REDIS_HEAD) ? 0 : -1;
        p = ziplistIndex(subject->ptr,pos);
        if (ziplistGet(p,&vstr,&vlen,&vlong)) {
            if (vstr) {
                value = createStringObject((char*)vstr,vlen);
            } else {
                value = createStringObjectFromLongLong(vlong);
            }
            /* We only need to delete an element when it exists */
            subject->ptr = ziplistDelete(subject->ptr,&p);
        }
    } else if (subject->encoding == REDIS_ENCODING_LINKEDLIST) {
        list *list = subject->ptr;
        listNode *ln;
        if (where == REDIS_HEAD) {
            ln = listFirst(list);
        } else {
            ln = listLast(list);
        }
        if (ln != NULL) {
            value = listNodeValue(ln);
            incrRefCount(value);
            listDelNode(list,ln);
        }
    } else {
        redisPanic("Unknown list encoding");
    }
    return value;
}

```

**t_hash.c**

```c
robj *hashTypeGetObject(robj *o, robj *key) {
    robj *objval;
    unsigned char *v;
    unsigned int vlen;

    int encoding = hashTypeGet(o,key,&objval,&v,&vlen);
    switch(encoding) {
        case REDIS_ENCODING_HT:
            incrRefCount(objval);
            return objval;
        case REDIS_ENCODING_ZIPMAP:
            objval = createStringObject((char*)v,vlen);
            return objval;
        default: return NULL;
    }
}
```

**t_set.c**

```c
int setTypeAdd(robj *subject, robj *value) {
    long long llval;
    if (subject->encoding == REDIS_ENCODING_HT) {
        if (dictAdd(subject->ptr,value,NULL) == DICT_OK) {
            incrRefCount(value);
            return 1;
        }
    } else if (subject->encoding == REDIS_ENCODING_INTSET) {
        if (isObjectRepresentableAsLongLong(value,&llval) == REDIS_OK) {
            uint8_t success = 0;
            subject->ptr = intsetAdd(subject->ptr,llval,&success);
            if (success) {
                /* Convert to regular set when the intset contains
                 * too many entries. */
                if (intsetLen(subject->ptr) > server.set_max_intset_entries)
                    setTypeConvert(subject,REDIS_ENCODING_HT);
                return 1;
            }
        } else {
            /* Failed to get integer from object, convert to regular set. */
            setTypeConvert(subject,REDIS_ENCODING_HT);

            /* The set *was* an intset and this value is not integer
             * encodable, so dictAdd should always work. */
            redisAssert(dictAdd(subject->ptr,value,NULL) == DICT_OK);
            incrRefCount(value);
            return 1;
        }
    } else {
        redisPanic("Unknown set encoding");
    }
    return 0;
}
```

**t_zset.c**

```c
/* This generic command implements both ZADD and ZINCRBY. */
void zaddGenericCommand(redisClient *c, robj *key, robj *ele, double score, int incr) {
    robj *zsetobj;
    zset *zs;
    zskiplistNode *znode;

    zsetobj = lookupKeyWrite(c->db,key);
    if (zsetobj == NULL) {
        zsetobj = createZsetObject();
        dbAdd(c->db,key,zsetobj);
    } else {
        if (zsetobj->type != REDIS_ZSET) {
            addReply(c,shared.wrongtypeerr);
            return;
        }
    }
    zs = zsetobj->ptr;

    /* Since both ZADD and ZINCRBY are implemented here, we need to increment
     * the score first by the current score if ZINCRBY is called. */
    if (incr) {
        /* Read the old score. If the element was not present starts from 0 */
        dictEntry *de = dictFind(zs->dict,ele);
        if (de != NULL)
            score += *(double*)dictGetEntryVal(de);

        if (isnan(score)) {
            addReplyError(c,"resulting score is not a number (NaN)");
            /* Note that we don't need to check if the zset may be empty and
             * should be removed here, as we can only obtain Nan as score if
             * there was already an element in the sorted set. */
            return;
        }
    }

    /* We need to remove and re-insert the element when it was already present
     * in the dictionary, to update the skiplist. Note that we delay adding a
     * pointer to the score because we want to reference the score in the
     * skiplist node. */
    if (dictAdd(zs->dict,ele,NULL) == DICT_OK) {
        dictEntry *de;

        /* New element */
        incrRefCount(ele); /* added to hash */
        znode = zslInsert(zs->zsl,score,ele);
        incrRefCount(ele); /* added to skiplist */

        /* Update the score in the dict entry */
        de = dictFind(zs->dict,ele);
        redisAssert(de != NULL);
        dictGetEntryVal(de) = &znode->score;
        touchWatchedKey(c->db,c->argv[1]);
        server.dirty++;
        if (incr)
            addReplyDouble(c,score);
        else
            addReply(c,shared.cone);
    } else {
        dictEntry *de;
        robj *curobj;
        double *curscore;
        int deleted;

        /* Update score */
        de = dictFind(zs->dict,ele);
        redisAssert(de != NULL);
        curobj = dictGetEntryKey(de);
        curscore = dictGetEntryVal(de);

        /* When the score is updated, reuse the existing string object to
         * prevent extra alloc/dealloc of strings on ZINCRBY. */
        if (score != *curscore) {
            deleted = zslDelete(zs->zsl,*curscore,curobj);
            redisAssert(deleted != 0);
            znode = zslInsert(zs->zsl,score,curobj);
            incrRefCount(curobj);

            /* Update the score in the current dict entry */
            dictGetEntryVal(de) = &znode->score;
            touchWatchedKey(c->db,c->argv[1]);
            server.dirty++;
        }
        if (incr)
            addReplyDouble(c,score);
        else
            addReply(c,shared.czero);
    }
}
```

## 4. redis  数据库



## 5. 网络通信


