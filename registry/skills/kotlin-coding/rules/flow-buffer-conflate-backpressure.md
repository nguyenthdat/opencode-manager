# flow-buffer-conflate-backpressure

> Use `buffer`/`conflate`/`collectLatest` to manage producer/consumer speed mismatches

## Why It Matters

By default a `Flow` runs producer and collector sequentially in lockstep — each emission waits for the collector to finish processing the previous one before the next is produced. When the producer is much faster than the collector, that default serialization either wastes the producer's throughput unnecessarily or, if you don't want to process every stale value, keeps you processing values you no longer care about.

## Bad

```kotlin
fun sensorReadings(): Flow<Reading> = flow {
    while (true) {
        emit(readSensor()) // fast: every 10ms
        delay(10)
    }
}

suspend fun bad() {
    sensorReadings().collect { reading ->
        renderExpensive(reading) // slow: takes 200ms - readings back up with no control
    }
}
```

## Good

```kotlin
suspend fun independentPipelines() {
    // buffer: let producer run ahead, queue results, process every one eventually
    sensorReadings()
        .buffer(capacity = 64)
        .collect { renderExpensive(it) }
}

suspend fun onlyLatestMatters() {
    // conflate: drop intermediate values, collector only ever sees the newest
    sensorReadings()
        .conflate()
        .collect { renderExpensive(it) }
}

suspend fun cancelStaleWork() {
    // collectLatest: cancels the in-flight collector action when a new value arrives
    sensorReadings()
        .collectLatest { reading ->
            renderExpensive(reading) // cancelled early if a newer reading shows up
        }
}
```

## Choosing Among Them

| Operator | Behavior | Use when |
|---|---|---|
| `buffer(n)` | Producer and collector run concurrently; up to `n` emissions queue | Every value must eventually be processed, some concurrency is fine |
| `conflate()` | Producer never waits; collector always gets the most recent value, dropping intermediates | Only the latest value matters (UI state, sensor snapshot) |
| `collectLatest { }` | Like conflate, but also cancels a slow in-progress collector action for a fresher value | The collector action itself is cancellable and stale work should stop, not just be skipped |

`buffer(capacity = Channel.UNLIMITED)` removes backpressure entirely — use a bounded capacity unless the producer is guaranteed to be finite and small.

## See Also

- [`flow-flatmapconcat-latest`](flow-flatmapconcat-latest.md) - flatMapLatest applies the same cancel-and-replace idea to nested flows
- [`flow-flowon-upstream`](flow-flowon-upstream.md) - flowOn introduces an implicit buffer by default
- [`flow-channel-vs-flow`](flow-channel-vs-flow.md) - Channel's own buffering and backpressure options
