---
title: Data Source
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2024-01-28 18:19:07
tags:
---

https://www.youtube.com/watch?v=rt_cUtb8LnQ

<!--more-->

## JDBC Driver

https://en.wikipedia.org/wiki/JDBC_driver

## DriverManager

> The basic service for managing a set of JDBC drivers.
>
> NOTE: The javax.sql.DataSource interface, provides another way to connect to a data source. The use of a DataSource object is the preferred means of connecting to a data source.
>
> As part of its initialization, the DriverManager class will attempt to load available JDBC drivers by using:
> 
> - The jdbc.drivers system property which contains a colon separated list of fully qualified class names of JDBC drivers. Each driver is loaded using the system class loader:
>   - jdbc.drivers=foo.bah.Driver:wombat.sql.Driver:bad.taste.ourDriver
>
> - Service providers of the java.sql.Driver class, that are loaded via the service-provider loading mechanism.

```java
Enumeration<Driver> drivers = DriverManager.getDrivers();
drivers.asIterator().forEachRemaining(driver -> {
    try {
        log.info("driver: {}", driver.toString());
        Properties properties = new Properties();
        properties.put("user", "root");
        properties.put("password", "root");

        try (Connection connection = driver.connect("jdbc:h2:mem:testdb", properties);
                Statement statement = connection.createStatement()) {
            statement.execute("SELECT CURRENT_DATE FROM DUAL");
            ResultSet resultSet = statement.getResultSet();
            while (resultSet.next()) {
                Date date = resultSet.getDate(1);
                log.info("date: {}", date);
            }
        }
    } catch (SQLException e) {
        throw new RuntimeException(e);
    }
});
```

## DataSource

> A factory for connections to the physical data source that this DataSource object represents. An alternative to the DriverManager facility, a DataSource object is the preferred means of getting a connection. An object that implements the DataSource interface will typically be registered with a naming service based on the Java Naming and Directory (JNDI) API.
> 
> The DataSource interface is implemented by a driver vendor. There are three types of implementations:
>
> 1. Basic implementation -- produces a standard Connection object
> 2. Connection pooling implementation -- produces a Connection object that will automatically participate in connection pooling. This implementation works with a middle-tier connection pooling manager.
> 3. Distributed transaction implementation -- produces a Connection object that may be used for distributed transactions and almost always participates in connection pooling. This implementation works with a middle-tier transaction manager and almost always with a connection pooling manager.
>
> A DataSource object has properties that can be modified when necessary. For example, if the data source is moved to a different server, the property for the server can be changed. The benefit is that because the data source's properties can be changed, any code accessing that data source does not need to be changed.
>
> A driver that is accessed via a DataSource object does not register itself with the DriverManager. Rather, a DataSource object is retrieved through a lookup operation and then used to create a Connection object. With a basic implementation, the connection obtained through a DataSource object is identical to a connection obtained through the DriverManager facility.

```java
private static DataSource createHikariDateSource(String driverClassName,
                                            String url, String user, String password) {
    return  DataSourceBuilder.create(ClassLoader.getSystemClassLoader())
            .type(HikariDataSource.class)
            .driverClassName(driverClassName)
            .url(url)
            .username(user)
            .password(password)
            .build();
}


DataSource dataSource = createHikariDateSource(
        dataSourceProperties.determineDriverClassName(),
        dataSourceProperties.determineUrl(),
        dataSourceProperties.determineUsername(),
        dataSourceProperties.determinePassword()
);
log.info("dataSource: {}", dataSource);
try (Connection connection = dataSource.getConnection();
        Statement statement = connection.createStatement()) {
    statement.execute("SELECT CURRENT_DATE FROM DUAL");
    ResultSet resultSet = statement.getResultSet();
    while (resultSet.next()) {
        Date date = resultSet.getDate(1);
        log.info("date: {}", date);
    }
}
```


## AbstractRoutingDataSource

> Abstract DataSource implementation that routes getConnection() calls to one of various target DataSources based on a lookup key. The latter is usually (but not necessarily) determined through some thread-bound transaction context.


## LazyConnectionDataSourceProxy

> Proxy for a target DataSource, fetching actual JDBC Connections lazily, i.e. not until first creation of a Statement. Connection initialization properties like auto-commit mode, transaction isolation and read-only mode will be kept and applied to the actual JDBC Connection as soon as an actual Connection is fetched (if ever). Consequently, commit and rollback calls will be ignored if no Statements have been created.
>
> This DataSource proxy allows to avoid fetching JDBC Connections from a pool unless actually necessary. JDBC transaction control can happen without fetching a Connection from the pool or communicating with the database; this will be done lazily on first creation of a JDBC Statement.
>
> If you configure both a LazyConnectionDataSourceProxy and a TransactionAwareDataSourceProxy, make sure that the latter is the outermost DataSource. In such a scenario, data access code will talk to the transaction-aware DataSource, which will in turn work with the LazyConnectionDataSourceProxy.
>
> Lazy fetching of physical JDBC Connections is particularly beneficial in a generic transaction demarcation environment. It allows you to demarcate transactions on all methods that could potentially perform data access, without paying a performance penalty if no actual data access happens.
>
> This DataSource proxy gives you behavior analogous to JTA and a transactional JNDI DataSource (as provided by the Jakarta EE server), even with a local transaction strategy like DataSourceTransactionManager or HibernateTransactionManager. It does not add value with Spring's JtaTransactionManager as transaction strategy.
>
> Lazy fetching of JDBC Connections is also recommended for read-only operations with Hibernate, in particular if the chances of resolving the result in the second-level cache are high. This avoids the need to communicate with the database at all for such read-only operations. You will get the same effect with non-transactional reads, but lazy fetching of JDBC Connections allows you to still perform reads in transactions.