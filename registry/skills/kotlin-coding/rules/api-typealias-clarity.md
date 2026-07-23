# api-typealias-clarity

> Use `typealias` to name complex function or generic types

## Why It Matters

Deeply nested generic types and multi-parameter lambda signatures are hard to read and easy to get wrong when repeated across a codebase - a `typealias` gives the shape a domain-meaningful name once, and every signature that uses it becomes self-documenting. It's purely a compile-time naming aid (no runtime cost, no new type), so it's essentially free clarity.

## Bad

```kotlin
class EventBus {
    private val listeners = mutableMapOf<String, MutableList<(Map<String, Any>) -> Unit>>()

    fun subscribe(event: String, listener: (Map<String, Any>) -> Unit) {
        listeners.getOrPut(event) { mutableListOf() }.add(listener)
    }
}

fun retry(
    times: Int,
    onFailure: (Throwable, Int) -> Boolean,
    block: suspend () -> Unit,
) { /* ... */ }
// Every reader has to mentally parse (Throwable, Int) -> Boolean each time it appears
```

## Good

```kotlin
typealias EventPayload = Map<String, Any>
typealias EventListener = (EventPayload) -> Unit

class EventBus {
    private val listeners = mutableMapOf<String, MutableList<EventListener>>()

    fun subscribe(event: String, listener: EventListener) {
        listeners.getOrPut(event) { mutableListOf() }.add(listener)
    }
}

typealias RetryDecision = (error: Throwable, attempt: Int) -> Boolean

fun retry(times: Int, onFailure: RetryDecision, block: suspend () -> Unit) { /* ... */ }
```

## Aliasing Generic Types

```kotlin
typealias ValidationResult<T> = Result<T>
typealias UserRepository = Repository<User, UserId>

// Also useful for disambiguating between similarly-shaped but semantically
// different types from different libraries, e.g. two "Result" classes:
typealias NetworkResult<T> = com.example.network.Result<T>
typealias DbResult<T> = com.example.database.Result<T>
```

## Caveat: No New Type, No Extra Safety

```kotlin
typealias UserId = String
typealias OrderId = String

fun charge(userId: UserId, orderId: OrderId) { /* ... */ }
charge(userId = "order-1", orderId = "user-1")  // Still compiles! typealias is not a new type.
// For real type safety (not just readability), use a value class instead:
// @JvmInline value class UserId(val value: String)
```

## See Also

- [`type-value-class-wrapper`](type-value-class-wrapper.md) - use value classes instead of typealias when type safety (not just naming) is needed
- [`api-dsl-lambda-receiver`](api-dsl-lambda-receiver.md) - typealiasing lambda-with-receiver DSL types
- [`anti-primitive-obsession`](anti-primitive-obsession.md) - the deeper fix when typealias isn't enough
