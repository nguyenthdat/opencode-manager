# flow-catch-operator

> Handle upstream failures with the `catch` operator, not a try/catch around `collect`

## Why It Matters

Wrapping `collect` in a try/catch handles exceptions thrown by the collector's own action lambda as well as upstream, conflating two very different failure sources and making it easy to accidentally swallow a `CancellationException`. The `catch` operator only intercepts exceptions from *upstream* of it in the flow, keeping collector-side logic and producer-side error handling clearly separated.

## Bad

```kotlin
suspend fun bad(flow: Flow<Data>) {
    try {
        flow.collect { data ->
            render(data) // if THIS throws, it gets caught too, masking a bug in render()
        }
    } catch (e: Exception) {
        log.error("Flow failed", e) // ambiguous: was it the source or render()?
    }
}
```

## Good

```kotlin
suspend fun good(flow: Flow<Data>) {
    flow
        .catch { e -> // only catches exceptions from upstream (the source, map, etc.)
            log.error("Upstream flow failed", e)
            emit(Data.empty()) // catch can emit a fallback value into the downstream flow
        }
        .collect { data ->
            render(data) // exceptions here propagate normally, not silently caught
        }
}
```

## catch Cannot See Downstream Exceptions

```kotlin
flowOf(1, 2, 3)
    .catch { e -> log.error("won't see this", e) } // placed before the throwing operator
    .map { if (it == 2) error("boom") else it }     // throws AFTER catch, so catch misses it
    .collect { println(it) }

// Correct placement: catch goes after every operator whose failures it should handle
flowOf(1, 2, 3)
    .map { if (it == 2) error("boom") else it }
    .catch { e -> log.error("caught", e) }
    .collect { println(it) }
```

## catch Never Catches Collector Exceptions

By design, `catch` cannot intercept exceptions thrown inside the terminal `collect` lambda — move that logic upstream via `onEach` if it needs to participate in `catch`'s handling:

```kotlin
flow
    .onEach { data -> render(data) } // now inside the chain catch can see
    .catch { e -> log.error("render or upstream failed", e) }
    .collect()
```

## See Also

- [`flow-avoid-side-effects-map`](flow-avoid-side-effects-map.md) - onEach as the place for side effects like render()
- [`flow-cancellable-collect`](flow-cancellable-collect.md) - collect must stay cancellable, catch must not swallow CancellationException
- [`err-no-catch-generic-exception`](err-no-catch-generic-exception.md) - the same principle applied outside flows
