# flow-cold-vs-hot

> Understand cold `Flow` versus hot `SharedFlow`/`StateFlow`

## Why It Matters

A cold `Flow` runs its producer block fresh for every collector, so two collectors of the same cold flow can trigger the expensive work (a network call, a database query) twice with no idea the other exists. Treating a cold flow like a broadcast stream — or a hot flow like something that "starts over" per collector — leads to duplicated work, missed emissions, or state that silently diverges between observers.

## Bad

```kotlin
// BAD: cold flow re-runs the network call for every single collector
fun priceUpdates(symbol: String): Flow<Price> = flow {
    while (true) {
        emit(api.fetchPrice(symbol)) // re-executed independently per collector!
        delay(1_000)
    }
}

fun watchTwice(symbol: String) {
    val prices = priceUpdates(symbol)
    // Two independent network polling loops are started here, not one shared stream
    scope.launch { prices.collect { println("A: $it") } }
    scope.launch { prices.collect { println("B: $it") } }
}
```

## Good

```kotlin
class PriceRepository(private val scope: CoroutineScope, private val api: PriceApi) {
    private val cache = mutableMapOf<String, StateFlow<Price>>()

    // Converted to hot once, shared by every collector — the poll runs a single time
    fun priceUpdates(symbol: String): StateFlow<Price?> = cache.getOrPut(symbol) {
        flow {
            while (true) {
                emit(api.fetchPrice(symbol))
                delay(1_000)
            }
        }.stateIn(scope, SharingStarted.WhileSubscribed(5_000), null)
    } as StateFlow<Price?>
}
```

## Cold Flow

- Defined with `flow { }`, `flowOf`, or on a collection/`Sequence` via extension functions.
- The builder block runs independently, from the start, for each `collect` call.
- No values exist until a collector subscribes — nothing is emitted "in the background".

## Hot Flow

- `StateFlow` and `SharedFlow` (and `Channel`-backed flows) emit values regardless of whether anyone is collecting.
- Multiple collectors observe the *same* ongoing stream, potentially missing values emitted before they subscribed (`StateFlow` replays only its latest value; `SharedFlow` replay is configurable).
- Created directly (`MutableStateFlow(initial)`) or derived from a cold flow via `stateIn`/`shareIn`.

## See Also

- [`flow-statein-sharein`](flow-statein-sharein.md) - converting cold flows to hot, and when to
- [`flow-stateflow-ui-state`](flow-stateflow-ui-state.md) - StateFlow as the canonical hot state holder
- [`flow-sharedflow-events`](flow-sharedflow-events.md) - SharedFlow for one-off hot events
