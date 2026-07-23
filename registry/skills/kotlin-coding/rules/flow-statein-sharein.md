# flow-statein-sharein

> Convert a cold flow to hot with `stateIn`/`shareIn` and an explicit `SharingStarted` policy

## Why It Matters

Collecting the same cold flow from multiple places re-triggers its (possibly expensive) upstream work for every collector, as if it had no shared cache at all. `stateIn`/`shareIn` convert a cold flow into a hot one backed by a single upstream collection, shared across every downstream collector — but the `SharingStarted` policy you choose determines whether that upstream work runs constantly, only while observed, or forever once started, each with real cost implications.

## Bad

```kotlin
class PriceViewModel(private val repository: PriceRepository) {
    // BAD: every screen that reads this property triggers its own independent
    // subscription to the repository's expensive polling flow
    val prices: Flow<Price> get() = repository.observePrices()
}
```

## Good

```kotlin
class PriceViewModel(
    private val repository: PriceRepository,
    scope: CoroutineScope,
) {
    val prices: StateFlow<Price?> = repository.observePrices()
        .stateIn(
            scope = scope,
            started = SharingStarted.WhileSubscribed(stopTimeoutMillis = 5_000),
            initialValue = null,
        )
    // Only one upstream subscription exists no matter how many collectors observe `prices`
}
```

## Choosing a SharingStarted Policy

```kotlin
// Eagerly: starts immediately when stateIn/shareIn is called, keeps running forever
SharingStarted.Eagerly

// Lazily: starts on first collector, keeps running forever after that (even with none)
SharingStarted.Lazily

// WhileSubscribed: starts on first collector, stops `stopTimeoutMillis` after the last
// one goes away - the usual choice for UI state, since it avoids polling with no observers
SharingStarted.WhileSubscribed(stopTimeoutMillis = 5_000)
```

`WhileSubscribed` with a small grace period avoids restarting an expensive upstream flow during a brief gap in collection, such as an Android configuration change, without leaving it running indefinitely once every collector is truly gone.

## stateIn vs shareIn

Use `stateIn` when the flow represents state with a meaningful "current value" (requires an `initialValue`, produces a `StateFlow` with conflation and equality-based deduplication). Use `shareIn` when the flow represents a stream of discrete events or you need configurable `replay` without state semantics (produces a `SharedFlow`, no initial value required).

## See Also

- [`flow-cold-vs-hot`](flow-cold-vs-hot.md) - the cold/hot distinction this operator bridges
- [`flow-stateflow-ui-state`](flow-stateflow-ui-state.md) - consuming the resulting StateFlow
- [`android-lifecyclescope-collect`](android-lifecyclescope-collect.md) - the collector-side lifecycle this often pairs with
