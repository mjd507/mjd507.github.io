---
title: Spring-Batch
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2022-03-26 19:14:17
tags:
---

https://spring.io/guides/gs/batch-processing/

<!--more-->

Introduction:

> A lightweight, comprehensive batch framework designed to enable the development of robust batch applications vital for the daily operations of enterprise systems.

> Spring Batch provides reusable functions that are essential in processing large volumes of records, including logging/tracing, transaction management, job processing statistics, job restart, skip, and resource management. It also provides more advanced technical services and features that will enable extremely high-volume and high performance batch jobs through optimization and partitioning techniques. Simple as well as complex, high-volume batch jobs can leverage the framework in a highly scalable manner to process significant volumes of information.

Steps for using batch to load data from csv files, then convert data, finally wirte the processed data into database. 

## Define Job and Step

```java
@Configuration
@EnableBatchProcessing
public class CsvFileImportJob {

    @Bean
    public Job initializeCsvFileImportJob(
            JobBuilderFactory jobBuilderFactory,
            Step csvFileImportStep,
            CsvFileListener csvFileListener) {
        return jobBuilderFactory.get("initializeCsvFileImportJob")
                .preventRestart()
                .incrementer(new RunIdIncrementer())
                .start(csvFileImportStep)
                .listener(csvFileListener)
                .build();
    }

    @Bean
    public Step csvFileImportStep(
            StepBuilderFactory stepBuilderFactory,
            CsvItemReader csvItemReader,
            CsvItemProcessor csvItemProcessor,
            CsvItemWriter csvItemWriter
    ) {
        return stepBuilderFactory.get("csvFileImportStep")
                .<Person, Person>chunk(1)
                .reader(csvItemReader)
                .processor(csvItemProcessor)
                .writer(csvItemWriter)
                .build();
    }
}

```

## Define ItemReader

```java

@Component
@Slf4j
@JobScope
public class CsvItemReader extends MultiResourceItemReader<Person> {

    @Value("#{jobExecutionContext['fileNames']}")
    private List<String> fileNames;

    @PostConstruct
    public void initializeReader() {
        log.info("Reader... initialize");
        log.info("fileNames:{}", fileNames);
        setResources(initResources());
        setDelegate(initFlatFileItemReader());
    }

    @SneakyThrows
    private Resource[] initResources() {
        return fileNames.stream().map(ClassPathResource::new).toArray(Resource[]::new);
    }

    private FlatFileItemReader<Person> initFlatFileItemReader() {

        return new FlatFileItemReaderBuilder<Person>()
                .name("Csv-File-Reader")
                .linesToSkip(1)
                .skippedLinesCallback(s -> {
                    log.info("skip first line: {}", s);
                })
                .lineMapper(lineMapper())
                .build();
    }

    private LineMapper<Person> lineMapper() {
        DelimitedLineTokenizer delimitedLineTokenizer = new DelimitedLineTokenizer();
        delimitedLineTokenizer.setDelimiter(",");
        delimitedLineTokenizer.setNames(Arrays.stream(Person.class.getDeclaredFields()).map(Field::getName).toArray(String[]::new));
        DefaultLineMapper<Person> defaultLineMapper = new DefaultLineMapper<>();
        defaultLineMapper.setLineTokenizer(delimitedLineTokenizer);

        BeanWrapperFieldSetMapper<Person> fieldSetMapper = new BeanWrapperFieldSetMapper<>();
        fieldSetMapper.setTargetType(Person.class);
        defaultLineMapper.setFieldSetMapper(fieldSetMapper);
        return defaultLineMapper;
    }
}
```

## Define ItemProcessor

```java
@Component
@Slf4j
public class CsvItemProcessor implements ItemProcessor<Person, Person> {

    @Override
    public Person process(final Person person) {
        final String firstName = person.getFirstName().toUpperCase();
        final String lastName = person.getLastName().toUpperCase();

        final Person transformedPerson = new Person(firstName, lastName);

        log.info("Converting (" + person + ") into (" + transformedPerson + ")");

        return transformedPerson;
    }
}

```

## Define ItemWriter

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class CsvItemWriter extends JdbcBatchItemWriter<Person> {

    private final DataSource dataSource;

    @PostConstruct
    public void initWriter() {
        log.info("Writer... initialize");
        this.setDataSource(dataSource);
        this.setItemSqlParameterSourceProvider(new BeanPropertyItemSqlParameterSourceProvider<>());
        this.setSql("INSERT INTO people (first_name, last_name) VALUES (:firstName, :lastName)");
    }

}
```

## Define JobListener

```java
@Component
@Slf4j
public class CsvFileListener implements JobExecutionListener {

    @Override
    public void beforeJob(JobExecution jobExecution) {
        ExecutionContext context = jobExecution.getExecutionContext();
        context.put("fileNames", new ArrayList<String>() {{
            add("sample-data.csv");
        }});
        log.info("before job ...");
    }

    @Override
    public void afterJob(JobExecution jobExecution) {
        log.info("after job ...");
    }
}

```

## Config JobLauncher & JobRepository

```java

@Configuration
@RequiredArgsConstructor
public class BatchLauncherConfig  {
    private final DataSource dataSource;
    private final PlatformTransactionManager transactionManager;

    @Bean
    public JobRepository customJobRepository() throws Exception {
        JobRepositoryFactoryBean factory = new JobRepositoryFactoryBean();
        factory.setDataSource(dataSource);
        factory.setTransactionManager(transactionManager);
        return factory.getObject();
    }

    @Bean
    public JobLauncher customJobLauncher() throws Exception {
        SimpleJobLauncher jobLauncher = new SimpleJobLauncher();
        jobLauncher.setJobRepository(customJobRepository());
        jobLauncher.afterPropertiesSet();
        return jobLauncher;
    }

}

```

## Define Common Launcher for Controller use

```java
@Component
@RequiredArgsConstructor
public class CommonLauncher implements ApplicationContextAware {
    private ApplicationContext applicationContext;
    private final JobLauncher customJobLauncher;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }

    @SneakyThrows
    public void run(String jobName) {
        Job job = (Job) applicationContext.getBean(jobName);
        JobParameters jobParameters = new JobParametersBuilder()
                .addString("traceId", UUID.randomUUID().toString())
                .toJobParameters();
        customJobLauncher.run(job, jobParameters);
    }
}

@RestController
@RequiredArgsConstructor
public class JobController {

    private final CommonLauncher commonLauncher;

    @GetMapping("run")
    public void run() {
        commonLauncher.run("initializeCsvFileImportJob");
    }
}

```

done.
