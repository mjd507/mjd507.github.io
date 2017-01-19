---
title: 个人精炼的 Android 数据库框架
categories: Android
toc: true
comments: true
date: 2017-01-15 11:57:24
tags:
---

CommonDao 总共只有 8 个类，核心类文件只有 5 个，客观来说，代码的可读性还是比较强的，但相比各大成熟的数据库框架，无论是性能或者可定制方面，亦或稳定性，都要逊色不少。算是一个学习的过程吧，最近一直在完善 CommonAndroid 基础库，刚把数据库部分弄好，决定把它单独作为一个模块来维护。欢迎各路大牛 star 或者 fork 来共同完善。数据库 [CommonDao 地址](https://github.com/mjd507/CommonDao)，Android 基本库 [CommonAndroid 地址](https://github.com/mjd507/CommonAndroid)。 

<!--more-->


## 基本写法

源码里 test/normal 目录下，有原始的数据库写法，这里就不贴了。现在需求假设是将一个用户的信息存进 Android 数据库，那么正常流程应该是这样：
> 
1. 准备好 Person 的 JavaBeen
2. 创建数据库，同事创建表。通过系统提供的 SQLiteOpenHelper 类来完成
3. 创建数据库操作类，完成 增删改查 功能

至此，就算完成了。你会发现非常简单，我们对数据库的操作只要一个 DBHelper 和一个 Dao 就完事了。确实是这样。对于很少使用到数据库的项目这样已经足够了，但是，如果项目中使用的数据库表很多，那么，我们就需要成倍的编写这些大体上算是重复的代码，相信你会感到恶心...... 



## 思考

上面我们在对数据库操作，归根结底是通过 Person 这个 JavaBeen 对象 来与 SQLite 关系型数据库 交互。**增改 —> 将 Person 的值映射到 SQLite 数据库中，查 —> 从 SQLite 中将取得的值转换成 Person。**

因为 JavaBeen 与数据库字段是对应的关系，所以，我们封装的时候就可以利用这个 Javabeen 对象。怎么利用呢？Person 这个类名 来作为数据库的表名，Person 里面的 字段 用来作为 数据库表的字段名。是不是很完美？

Person 类名好弄，属性怎么获取？ 这里就要用到反射。同时因为数据库有主键等，所以还需要定义一些注解来区分。

我们都知道反射会影响效率，那么就需要在一次反射后保存该 JavaBeen（表和字段）的信息。否则每次增删改查都需要反射。



## 注解的定义

能定义的注解还不少，比如表名，字段名，字段属性（primaryKey，not null … ），但个人觉得除了定义列属性是否是主键外，其它的注解没有必要，就用 JavaBeen 的 类名 以及字段名，保持了一致性，找错也容易些。所以这里我最终将注解简化成 Column 一个文件，内容如下：

```java
/**
 * 描述: 数据库列名
 * Created by mjd on 2017/1/7.
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Column {
    /**
     * 是否为主键 默认不是主键
     */
    boolean primaryKey() default false;

}
```



## 实体的定义

这里实体需要分开，包括 JavaBeen 和 它里面的 成员变量，他们对应于数据库的 表 和 字段 。我们的目的是 用 Java 语句 动态的生成 数据库 表语句。这个表语句是由 表名 + 字段类型 + 字段名称 来拼接的。

所以我们的第一步 包装 成员变量，使之可以提供 数据名称 和 数据名称。因为 成员变量 对应于 数据库的 字段，也就是栏目 Column，所以我这里类名取之为 ColumnEntity ，但是不要误读，它里面的方法都是针对 成员变量。

先看我定义的 ColumnEntity 的 构造方法：

```java
    ColumnEntity(Field field) {
        this.field = field;
        field.setAccessible(true);//设置访问权限
        this.name = field.getName();
        this.primaryKey = field.isAnnotationPresent(Column.class) && field.getAnnotation(Column.class).primaryKey();
        this.type = field.getType();
    }
```

这里接受一个 Field 对象，JavaBeen 通过 类名.class.getDeclaredFields 可以获取该类所有的 Fields，有了这个 Field 就可以获取到 成员变量的 类型，名称，值。如果你在字段上使用了注解主键，这里也会获取到其值。好，现在仅需要提供一些 get 方法就可以 获取到 类型 + 名称 了。数据库操作离不开 增删改查，这里也提供了 为 成员变量 设值（对应查询） 和 获取值得方法（对应增改），这里尤其不要跟一般的搞混。


接下来就是包装 JavaBeen，因为里面的 成员变量 上面已经包装好了，所以，这里就方便多了。JavaBeen 对应的是数据库的 表的实体，也就是 Table，所以我这里就用 TableEntity了，再次提醒，不要误读，他针对的是 JavaBeen。来看下构造方法：

```java
    public TableEntity(Class<?> type) {
        tableName = type.getSimpleName();
        fields = new ArrayList<>();
        for (Field field : type.getDeclaredFields()) {
            fields.add(new ColumnEntity(field));
        }
    }
```

这里接受一个 Class 对象，有了这个 Class，就可以使用它的名称来做表名，同时构建时 Class 内所有 field 的 ColumnEntity。至此建表的准备工作已经差不多了。接下来就是拼接建表语句了。根据字段的类型选择相应的数据库字段类型。

```java

    public String getCreateTableStatement() {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("CREATE TABLE IF NOT EXISTS %s (", tableName));
        int index = 0;

        for (ColumnEntity field : fields) {
            sb.append(field.getName()).append(" ");
            sb.append(getSqlType(field)).append(" ");
            sb.append(index < fields.size() - 1 ? "," : ")");
            index++;
        }
        return sb.toString();
    }

    private String getSqlType(ColumnEntity field) {
        Class type = field.getType();
        if (field.isPrimaryKey()) {
            return "INTEGER PRIMARY KEY AUTOINCREMENT";
        } else if (type.equals(String.class)) {
            return "TEXT";
        } else if (type.equals(int.class) || type.equals(Integer.class)) {
            return "INT";
        } else if (type.equals(long.class) || type.equals(Long.class)) {
            return "INT";
        } else if (type.equals(boolean.class) || type.equals(Boolean.class)) {
            return "INT";
        } else if (type.equals(double.class) || type.equals(Double.class)) {
            return "FLOAT";
        }
        return null;
    }
```

ok, 到这里，你只需调用 new TableEntity(Person.class).getCreateTableStatement(), 就可以自动的构建一个 SQL 语句，以 Person 为表名，Person 里面的字段 为数据库字段名的 SQL 语句。
** "CREATE TABLE IF NOT EXISTS Person (age INT,name TEXT)" **
是不是感觉一下子简化了不少生产力.

TableEntity 还有一个 将 JavaBeen 转换成 ContentValues 的 方法。原理就是遍历所有 field，获取其值，设置到 ContentValues 当中，以便于增改操作。


## TableManager 的定义

为什么要定义一个 TableManager, 前面在思考的时候也提过，反射操作在效率上不太理想，而每次我们调用 new TableEntity(Class<?> clazz) 时，都会通过反射去获取每一个 成员变量，每一个成员变量也会通过反射来获取其相关信息。所以如果我们每次增删改查都去 new TableEntity(Person.class),效率太低了，所以出现了 TableManager，单例模式，使用 HashMap 保存 表实体。

表的创建 以及 查找 全部交由 TableManager 完成。这里提供了一个 register() 方法，你可以在应用开始的时候就去注册表的实体，这里还没有创建，但能为需要创建表时提高效率。

```java

    public void register(Class<?>... types) {
        for (Class<?> type : types) {
            if (find(type) != null) {
                LogUtils.d(TAG, "表已注册过");
                continue;
            }
            TableEntity m = new TableEntity(type);
            entities.put(type, m);
            entityList.add(m);
        }
    }

    public TableEntity find(Class<?> type) {
        return entities.get(type);
    }

```

使用 TableManager 创建表

```java
    public void createTables(DbDao dao) {
        try {
            for (TableEntity tableEntity : entityList) {
                dao.execute(tableEntity.getCreateTableStatement(), null);
            }
        } catch (Exception ex) {
            LogUtils.e(TAG, "表创建失败:" + ex.getMessage());
        }
    }

```

这里需要传入一个 DbDao，其实就是数据库具体增删改查的类了。到这里，你也应该能猜到，要在数据库中创建表，必须先获得一个 DbDao 对象，DbDao 里面必须有 SQLiteOpenHelper。


## Dao 的定义

和你想象的一样，只有增删改查的方法，我们先来看下构造方法。

```java
    public DbDao(Context context, DbParams params, DbUpdateListener dbUpdateListener) {
        this.mDbHelper = new DbHelper(context, params.dbName, null, params.dbVersion, dbUpdateListener);
    }

```
DbDao 构造时需要 DbParams，这个是配置 数据库表名 以及 版本号 的类。目前存放在 DbManager 中。后面会介绍。另外一个参数 DbUpdateListener，这是一个接口，SQLiteOpenHelper 里的 onUpgrade() 方法里就是通过该接口将升级的处理回调给调用者。

构造方法里初始化了一个 DbHelper，其实就是 SQLiteOpenHelper，与普通的写法没有任何区别，SQLiteOpenHelper 里面 onCreate 的方法没有任何操作，因为创建表的操作已经交由 TableManager 去执行了, TableManager 里面会组织好 SQL 语句，交给 DbDao 的 execute()方法。

```java
    public void execute(String sql, String[] bindArgs) throws Exception {
        LogUtils.i(TAG, "准备执行SQL[ " + sql + " ]语句");
        mDb = mDbHelper.getWritableDatabase();
        if (mDb.isOpen()) {
            if (!TextUtils.isEmpty(sql)) {
                if (bindArgs != null) {
                    mDb.execSQL(sql, bindArgs);
                } else {
                    mDb.execSQL(sql);
                }
                LogUtils.i(TAG, "执行完毕！");
            }
        } else {
            throw new Exception("数据库未打开！");
        }
    }

```

其余的增删改查方法就不贴出来了，想要研究或者改造的，欢迎去 GitHub 上 fork 或者 star，地址文章开头已经给了。

至此，CommonDao 的框架的核心部分都已经理了一理，剩余还有个 DbManager，这个是数据库统一配置的管理类，单例模式，提供了默认的以及可设置的数据库名称，版本号，以及升级的监听器。记得在 Application 的创建的时候初始化 该 DbManager。

期待你的加入，让 CommonDao 越来越健壮。


<br /><br /><br />

<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/"><img alt="知识共享许可协议" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-nd/3.0/cn/88x31.png" /></a><br />本作品采用<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/">知识共享署名-非商业性使用-禁止演绎 3.0 中国大陆许可协议</a>进行许可。