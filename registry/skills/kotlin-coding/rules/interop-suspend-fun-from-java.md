# interop-suspend-fun-from-java

> Expose coroutine APIs to Java via `@JvmStatic` futures or callback wrappers

## Why It Matters

Java has no `suspend` keyword — a Kotlin `suspend fun` compiles to a method taking an extra `Continuation` parameter that Java code cannot call directly. Libraries intended for Java consumers need an explicit adapter such as `CompletableFuture`, `ListenableFuture`, or a callback interface.

## Bad

```kotlin
class UserRepository {
    suspend fun fetchUser(id: String): User { // Java literally cannot call this
        return withContext(Dispatchers.IO) { api.getUser(id) }
    }
}
```

## Good

```kotlin
class UserRepository(private val scope: CoroutineScope) {
    suspend fun fetchUser(id: String): User =
        withContext(Dispatchers.IO) { api.getUser(id) }

    // Java-friendly adapter using kotlinx-coroutines-jdk8
    fun fetchUserAsync(id: String): CompletableFuture<User> =
        scope.future { fetchUser(id) } // uses a real, lifecycle-owned scope, not GlobalScope
}
```

```java
// Java consumes the CompletableFuture naturally
repository.fetchUserAsync("42").thenAccept(user -> render(user));
```

## Callback-Style Alternative

```kotlin
class UserRepository(private val scope: CoroutineScope) {
    fun fetchUser(id: String, onResult: (Result<User>) -> Unit) {
        scope.launch {
            val result = runCatching { withContext(Dispatchers.IO) { api.getUser(id) } }
            onResult(result)
        }
    }
}
```

## See Also

- [`interop-jvmstatic-companion`](interop-jvmstatic-companion.md) - making the adapter method Java-friendly to call
- [`async-structured-concurrency`](async-structured-concurrency.md) - the scope discipline the adapter should follow
- [`async-no-globalscope`](async-no-globalscope.md) - why the adapter must not default to `GlobalScope`
