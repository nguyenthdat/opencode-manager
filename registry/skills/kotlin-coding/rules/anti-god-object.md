# anti-god-object

> Don't build a God object/manager class with too many responsibilities

## Why It Matters

A class named `Manager`, `Helper`, or `Utils` that accumulates every loosely-related piece of logic becomes a merge-conflict magnet, is impossible to unit test in isolation (every test drags in all its dependencies), and violates the single-responsibility principle so thoroughly that nobody can describe what it "is" in one sentence. It also tends to centralize mutable state that every other part of the codebase secretly depends on.

## Bad

```kotlin
// Does authentication, caching, logging, network retries, and formatting.
// What does this class actually represent? Nobody can say in one sentence.
class AppManager(
    private val httpClient: HttpClient,
    private val db: Database,
    private val logger: Logger,
) {
    fun login(username: String, password: String): User = /* ... */ error("unimplemented")
    fun cacheGet(key: String): String? = /* ... */ error("unimplemented")
    fun cachePut(key: String, value: String) { /* ... */ }
    fun logEvent(event: String) { /* ... */ }
    fun retryRequest(request: Request, times: Int): Response = /* ... */ error("unimplemented")
    fun formatCurrency(amount: Long): String = /* ... */ error("unimplemented")
    fun formatDate(epochMillis: Long): String = /* ... */ error("unimplemented")
}
```

## Good

```kotlin
class AuthService(private val httpClient: HttpClient) {
    fun login(username: String, password: String): User = /* ... */ error("unimplemented")
}

class ResponseCache(private val db: Database) {
    fun get(key: String): String? = /* ... */ error("unimplemented")
    fun put(key: String, value: String) { /* ... */ }
}

class RetryingHttpClient(private val delegate: HttpClient) {
    suspend fun request(request: Request, times: Int): Response = /* ... */ error("unimplemented")
}

object CurrencyFormatter {
    fun format(amountCents: Long): String = /* ... */ error("unimplemented")
}
// Each class has one reason to change, and can be tested in isolation
// with only the collaborators it actually needs
```

## When It's Still Sometimes Seen

A small facade that delegates to focused collaborators can look similar but isn't the anti-pattern — the test is whether it *contains* logic (God object) or merely *wires together* single-purpose classes for convenience (composition root / facade).

```kotlin
class AppFacade(
    private val auth: AuthService,
    private val cache: ResponseCache,
) {
    // Thin delegation, no business logic of its own - fine
    fun login(u: String, p: String) = auth.login(u, p)
}
```

## See Also

- [`proj-package-by-feature`](proj-package-by-feature.md) - packaging by feature naturally discourages one giant class per layer
- [`lint-detekt-complexity-rules`](lint-detekt-complexity-rules.md) - `LargeClass`/`TooManyFunctions` catch this automatically
- [`anti-companion-object-god`](anti-companion-object-god.md) - the same problem, scoped to a companion object
