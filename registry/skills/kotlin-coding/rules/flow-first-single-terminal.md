# flow-first-single-terminal

> Use terminal operators (`first`, `toList`, `reduce`) instead of manual collection loops

## Why It Matters

Manually collecting a flow into a mutable accumulator to extract "just the first value" or "the whole list" reimplements logic the standard library already provides, correctly, with proper cancellation of the upstream once the terminal condition is met. `first()` cancels the flow as soon as a value arrives instead of collecting values you'll never use, which a hand-rolled loop typically forgets to do.

## Bad

```kotlin
suspend fun bad(flow: Flow<Event>): Event {
    var result: Event? = null
    // BAD: collects forever even after finding the first match, never cancels upstream
    flow.collect { event ->
        if (result == null) result = event
    }
    return result ?: error("no events")
}

suspend fun badToList(flow: Flow<Item>): List<Item> {
    val items = mutableListOf<Item>()
    flow.collect { items.add(it) } // reimplements toList()
    return items
}
```

## Good

```kotlin
suspend fun good(flow: Flow<Event>): Event =
    flow.first() // suspends until the first emission, then cancels upstream automatically

suspend fun goodOrNull(flow: Flow<Event>): Event? =
    flow.firstOrNull { it.isRelevant } // first matching predicate, or null if flow completes

suspend fun goodToList(flow: Flow<Item>): List<Item> =
    flow.toList()

suspend fun goodReduce(flow: Flow<Int>): Int =
    flow.reduce { acc, value -> acc + value }
```

## Other Useful Terminal Operators

```kotlin
flow.count()                      // number of emissions
flow.single()                     // exactly one emission expected, throws otherwise
flow.fold(0) { acc, v -> acc + v } // like reduce, but with a seed value
flow.last()                       // waits for completion, returns the final value
```

`first()` and `firstOrNull()` are especially valuable because they cancel the upstream flow the moment they're satisfied — critical when the upstream is an infinite or expensive stream (like `callbackFlow` wrapping a hardware sensor) that should stop producing as soon as you have what you need.

## See Also

- [`flow-cancellable-collect`](flow-cancellable-collect.md) - cancellation semantics that terminal operators rely on
- [`flow-cold-vs-hot`](flow-cold-vs-hot.md) - why cancelling upstream after first() matters most for cold flows
- [`fn-collection-operator-chaining`](fn-collection-operator-chaining.md) - the equivalent idiom for plain collections
