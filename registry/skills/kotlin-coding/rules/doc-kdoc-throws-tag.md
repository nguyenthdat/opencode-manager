# doc-kdoc-throws-tag

> Document thrown exceptions with `@throws`

## Why It Matters

Kotlin has no `throws` keyword or checked exceptions, so nothing in a function's signature tells a caller which exceptions to expect or catch — the only place that information can live is the KDoc. Omitting `@throws` means callers discover exceptional behavior only by reading the implementation or, worse, by hitting an uncaught exception in production.

## Bad

```kotlin
/** Parses a configuration file into a [Config]. */
fun loadConfig(path: Path): Config {
    if (!path.exists()) throw FileNotFoundException(path.toString())
    val text = path.readText()
    return ConfigParser.parse(text) // throws ConfigParseException on malformed input
}
```

## Good

```kotlin
/**
 * Parses a configuration file into a [Config].
 *
 * @throws FileNotFoundException if [path] does not exist.
 * @throws ConfigParseException if the file's contents are not valid config syntax.
 */
fun loadConfig(path: Path): Config {
    if (!path.exists()) throw FileNotFoundException(path.toString())
    val text = path.readText()
    return ConfigParser.parse(text)
}
```

## Documenting Exceptions from Called Functions

```kotlin
/**
 * Fetches the user's profile from the remote API.
 *
 * @throws IOException if the network request fails.
 * @throws HttpException if the server returns a non-2xx status code.
 */
suspend fun fetchProfile(userId: String): Profile {
    val response = httpClient.get("/users/$userId") // may throw IOException
    if (!response.isSuccessful) throw HttpException(response.code) // documented explicitly
    return response.parseBody()
}
```

Document exceptions your function throws directly *and* exceptions it deliberately lets propagate from a called function when that's a meaningful part of the contract — you don't need to enumerate every possible `RuntimeException` a callee could theoretically throw, only the ones a caller should reasonably plan to catch.

## See Also

- [`doc-kdoc-public-api`](doc-kdoc-public-api.md) - the base rule `@throws` extends
- [`err-custom-exception-hierarchy`](err-custom-exception-hierarchy.md) - designing the exception types being documented
- [`err-exceptions-for-exceptional`](err-exceptions-for-exceptional.md) - deciding when a thrown exception is the right signal at all
