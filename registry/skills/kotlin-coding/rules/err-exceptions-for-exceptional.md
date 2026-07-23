# err-exceptions-for-exceptional

> Reserve exceptions for truly exceptional conditions, not routine control flow

## Why It Matters

Throwing and catching exceptions for expected, everyday outcomes (an item not found, a form field failing validation, end of input) is slower than a normal return path and obscures which outcomes are routine versus which are genuine bugs or environment failures. Using return types to model expected failure keeps the "happy path vs. expected failure" branching visible at the call site instead of hidden in a `try`/`catch`.

## Bad

```kotlin
class ItemNotFoundException(id: String) : Exception("Item $id not found")

fun findItem(id: String): Item {
    return items[id] ?: throw ItemNotFoundException(id)
}

fun checkout(id: String): Receipt {
    return try {
        val item = findItem(id)
        buildReceipt(item)
    } catch (e: ItemNotFoundException) {
        Receipt.empty()  // Using exceptions for an entirely expected, routine case
    }
}
```

## Good

```kotlin
fun findItem(id: String): Item? = items[id]

fun checkout(id: String): Receipt {
    val item = findItem(id) ?: return Receipt.empty()
    return buildReceipt(item)
}

// For richer expected-failure information than null, model it explicitly
sealed interface LookupResult {
    data class Found(val item: Item) : LookupResult
    data class NotFound(val id: String) : LookupResult
}

fun findItemDetailed(id: String): LookupResult =
    items[id]?.let { LookupResult.Found(it) } ?: LookupResult.NotFound(id)
```

## Where Exceptions Are Still Right

Genuinely exceptional conditions — a corrupted file, a network call that violates its documented contract, a bug that indicates invariant violation — should still throw, because forcing every caller to handle them via a return value would clutter code that has no meaningful recovery path.

```kotlin
fun parseConfig(path: Path): Config {
    val text = Files.readString(path)  // Throws IOException - a real environment failure
    return Json.decodeFromString(text)  // Throws on malformed JSON - a real bug/corruption
}
```

## See Also

- [`err-result-explicit-modeling`](err-result-explicit-modeling.md) - the sealed-type alternative shown above
- [`err-no-catch-generic-exception`](err-no-catch-generic-exception.md) - avoid masking real exceptional failures
- [`type-sealed-class-hierarchy`](type-sealed-class-hierarchy.md) - the mechanism for modeling expected outcomes
- [`err-nothing-to-propagate`](err-nothing-to-propagate.md) - let true exceptional failures propagate unhandled
