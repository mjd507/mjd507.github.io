---
title: RestClient
categories: Big-Back-End
toc: true
comments: true
copyright: true
hidden: false
date: 2025-07-27 13:51:29
tags:
---

[RestClient Official Document](https://docs.spring.io/spring-framework/reference/integration/rest-clients.html)

> The RestClient is a synchronous HTTP client that offers a modern, fluent API. It offers an abstraction over HTTP libraries that allows for convenient conversion from a Java object to an HTTP request, and the creation of objects from an HTTP response.

Lets see how it is designed.

<!--more-->

All interfaces below are defined inside one root interface - `RestClient`.

## RequestHeadersSpec

```java

  /**
   * Contract for specifying request headers leading up to the exchange.
   *
   * @param <S> a self reference to the spec type
   */
  interface RequestHeadersSpec<S extends RequestHeadersSpec<S>> {

    S accept(MediaType... acceptableMediaTypes);

    S acceptCharset(Charset... acceptableCharsets);

    S cookie(String name, String value);

    S cookies(Consumer<MultiValueMap<String, String>> cookiesConsumer);

    S ifModifiedSince(ZonedDateTime ifModifiedSince);

    S ifNoneMatch(String... ifNoneMatches);

    S header(String headerName, String... headerValues);

    S headers(Consumer<HttpHeaders> headersConsumer);

    S apiVersion(Object version);

    S attribute(String name, Object value);

    S attributes(Consumer<Map<String, Object>> attributesConsumer);

    S httpRequest(Consumer<ClientHttpRequest> requestConsumer);

    @CheckReturnValue
    ResponseSpec retrieve();


    default <T extends @Nullable Object> T exchange(ExchangeFunction<T> exchangeFunction) {
      return exchange(exchangeFunction, true);
    }

    default <T> T exchangeForRequiredValue(RequiredValueExchangeFunction<T> exchangeFunction) {
      return exchangeForRequiredValue(exchangeFunction, true);
    }

    <T extends @Nullable Object> T exchange(ExchangeFunction<T> exchangeFunction, boolean close);

    <T> T exchangeForRequiredValue(RequiredValueExchangeFunction<T> exchangeFunction, boolean close);


    @FunctionalInterface
    interface ExchangeFunction<T extends @Nullable Object> {

      T exchange(HttpRequest clientRequest, ConvertibleClientHttpResponse clientResponse) throws IOException;
    }

    @FunctionalInterface
    interface RequiredValueExchangeFunction<T> extends ExchangeFunction<@NonNull T> {

      @Override
      T exchange(HttpRequest clientRequest, ConvertibleClientHttpResponse clientResponse) throws IOException;
    }

    interface ConvertibleClientHttpResponse extends ClientHttpResponse {

      <T> @Nullable T bodyTo(Class<T> bodyType);

      <T> @Nullable T bodyTo(ParameterizedTypeReference<T> bodyType);
    }
  }

```

## UriSpec

```java
  /**
   * Contract for specifying the URI for a request.
   *
   * @param <S> a self reference to the spec type
   */
  interface UriSpec<S extends RequestHeadersSpec<?>> {

    S uri(URI uri);

    S uri(String uri, @Nullable Object... uriVariables);

    S uri(String uri, Map<String, ? extends @Nullable Object> uriVariables);

    S uri(String uri, Function<UriBuilder, URI> uriFunction);

    S uri(Function<UriBuilder, URI> uriFunction);
  }
```

## RequestBodySpec

```java
  /**
   * Contract for specifying request headers and body leading up to the exchange.
   */
  interface RequestBodySpec extends RequestHeadersSpec<RequestBodySpec> {

    RequestBodySpec contentLength(long contentLength);

    RequestBodySpec contentType(MediaType contentType);


    RequestBodySpec body(Object body);

    <T> RequestBodySpec body(T body, ParameterizedTypeReference<T> bodyType);

    RequestBodySpec body(StreamingHttpOutputMessage.Body body);

    RequestBodySpec hint(String key, Object value);
  }

```

## RequestHeadersUriSpec / RequestBodyUriSpec

```java
  /**
   * Contract for specifying request headers and URI for a request.
   *
   * @param <S> a self reference to the spec type
   */
  interface RequestHeadersUriSpec<S extends RequestHeadersSpec<S>> extends UriSpec<S>, RequestHeadersSpec<S> {
  }

  /**
   * Contract for specifying request headers, body and URI for a request.
   */
  interface RequestBodyUriSpec extends RequestBodySpec, RequestHeadersUriSpec<RequestBodySpec> {
  }

```

## ResponseSpec

```java
  /**
   * Contract for specifying response operations following the exchange.
   */
  interface ResponseSpec {

    ResponseSpec onStatus(Predicate<HttpStatusCode> statusPredicate,
        ErrorHandler errorHandler);

    ResponseSpec onStatus(ResponseErrorHandler errorHandler);

    <T> @Nullable T body(Class<T> bodyType);

    <T> @Nullable T body(ParameterizedTypeReference<T> bodyType);

    <T> ResponseEntity<T> toEntity(Class<T> bodyType);

    <T> ResponseEntity<T> toEntity(ParameterizedTypeReference<T> bodyType);

    ResponseEntity<Void> toBodilessEntity();

    ResponseSpec hint(String key, Object value);

    @FunctionalInterface
    interface ErrorHandler {

      void handle(HttpRequest request, ClientHttpResponse response) throws IOException;
    }
  }

```

## Builder

```java
  /**
   * A mutable builder for creating a {@link RestClient}.
   */
  interface Builder {


    Builder baseUrl(String baseUrl);

    Builder baseUrl(URI baseUrl);

    Builder defaultUriVariables(Map<String, ?> defaultUriVariables);

    Builder uriBuilderFactory(UriBuilderFactory uriBuilderFactory);

    Builder defaultHeader(String header, String... values);

    Builder defaultHeaders(Consumer<HttpHeaders> headersConsumer);

    Builder defaultCookie(String cookie, String... values);

    Builder defaultCookies(Consumer<MultiValueMap<String, String>> cookiesConsumer);

    Builder defaultApiVersion(Object version);

    Builder apiVersionInserter(ApiVersionInserter apiVersionInserter);

    Builder defaultRequest(Consumer<RequestHeadersSpec<?>> defaultRequest);

    Builder defaultStatusHandler(Predicate<HttpStatusCode> statusPredicate,
            ResponseSpec.ErrorHandler errorHandler);

    Builder defaultStatusHandler(ResponseErrorHandler errorHandler);

    Builder requestInterceptor(ClientHttpRequestInterceptor interceptor);

    Builder requestInterceptors(Consumer<List<ClientHttpRequestInterceptor>> interceptorsConsumer);

    Builder bufferContent(BiPredicate<URI, HttpMethod> predicate);

    Builder requestInitializer(ClientHttpRequestInitializer initializer);

    Builder requestInitializers(Consumer<List<ClientHttpRequestInitializer>> initializersConsumer);

    Builder requestFactory(ClientHttpRequestFactory requestFactory);

    Builder messageConverters(Iterable<HttpMessageConverter<?>> messageConverters);

    Builder configureMessageConverters(Consumer<HttpMessageConverters.ClientBuilder> configurer);

    Builder observationRegistry(ObservationRegistry observationRegistry);

    Builder observationConvention(ClientRequestObservationConvention observationConvention);

    Builder apply(Consumer<Builder> builderConsumer);

    Builder clone();

    RestClient build();
  }

```

## RestClient

```java
/**
 * Client to perform HTTP requests, exposing a fluent, synchronous API over
 * underlying HTTP client libraries such as the JDK {@code HttpClient}, Apache
 * HttpComponents, and others.
 *
 * <p>Use static factory methods {@link #create()}, {@link #create(String)},
 * or {@link RestClient#builder()} to prepare an instance. To use the same
 * configuration as a {@link RestTemplate}, use {@link #create(RestTemplate)} or
 * {@link #builder(RestTemplate)}.
 *
 * <p>For examples with a response body see:
 * <ul>
 * <li>{@link RequestHeadersSpec#retrieve() retrieve()}
 * <li>{@link RequestHeadersSpec#exchange(RequestHeadersSpec.ExchangeFunction) exchange(Function&lt;ClientHttpRequest, T&gt;)}
 * </ul>
 *
 * <p>For examples with a request body see:
 * <ul>
 * <li>{@link RequestBodySpec#body(Object) body(Object)}
 * <li>{@link RequestBodySpec#body(Object, ParameterizedTypeReference) body(Object, ParameterizedTypeReference)}
 * <li>{@link RequestBodySpec#body(StreamingHttpOutputMessage.Body) body(Consumer&lt;OutputStream&gt;)}
 * </ul>
 *
 * @author Arjen Poutsma
 * @author Sebastien Deleuze
 * @since 6.1
 */
public interface RestClient {

  RequestHeadersUriSpec<?> get();

  RequestHeadersUriSpec<?> head();

  RequestBodyUriSpec post();

  RequestBodyUriSpec put();

  RequestBodyUriSpec patch();

  RequestHeadersUriSpec<?> delete();

  RequestHeadersUriSpec<?> options();

  RequestBodyUriSpec method(HttpMethod method);

  Builder mutate();


  // Static factory methods

  static RestClient create() {
    return new DefaultRestClientBuilder().build();
  }

  static RestClient create(String baseUrl) {
    return new DefaultRestClientBuilder().baseUrl(baseUrl).build();
  }

  static RestClient create(URI baseUrl) {
    return new DefaultRestClientBuilder().baseUrl(baseUrl).build();
  }

  static RestClient create(RestTemplate restTemplate) {
    return new DefaultRestClientBuilder(restTemplate).build();
  }

  static RestClient.Builder builder() {
    return new DefaultRestClientBuilder();
  }

  static RestClient.Builder builder(RestTemplate restTemplate) {
    return new DefaultRestClientBuilder(restTemplate);
  }

  // RequestHeadersSpec

  // UriSpec

  // RequestBodySpec

  // RequestHeadersUriSpec 

  // RequestBodyUriSpec

  // ResponseSpec

  // Builder

}
```


End.
