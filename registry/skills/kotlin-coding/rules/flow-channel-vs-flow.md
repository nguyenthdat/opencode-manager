# flow-channel-vs-flow

> Choose `Channel` for hot, back-pressured single-consumer communication

## Why It Matters

`Flow` is a cold, declarative sequence built for transforming and multi-casting values through operators; `Channel` is a hot, imperative primitive built for handing individual values from producers to a single consumer, like a concurrent queue. Using a `Flow` where you actually need point-to-point handoff between coroutines (or vice versa) leads to awkward workarounds — callbackFlow boilerplate for something a Channel does directly, or a Channel used where multiple independent collectors were really needed.

## Bad

```kotlin
// BAD: reimplementing a producer/consumer queue with a shared mutable list and polling
class TaskQueue {
    private val tasks = mutableListOf<Task>()

    suspend fun enqueue(task: Task) {
        tasks.add(task) // no backpressure, no suspension, race-prone
    }

    suspend fun dequeue(): Task {
        while (tasks.isEmpty()) delay(50) // busy-polling instead of suspending
        return tasks.removeAt(0)
    }
}
```

## Good

```kotlin
class TaskQueue(capacity: Int = Channel.BUFFERED) {
    private val channel = Channel<Task>(capacity)

    suspend fun enqueue(task: Task) {
        channel.send(task) // suspends when the buffer is full - real backpressure
    }

    suspend fun dequeue(): Task = channel.receive()

    fun close() = channel.close()
}

// Producer/consumer coroutines
scope.launch { repeat(10) { queue.enqueue(Task(it)) } }
scope.launch {
    for (task in queue) { // consumes until the channel is closed
        process(task)
    }
}
```

## When to Reach for Flow Instead

If you need multiple independent collectors, declarative transformation operators (`map`, `filter`, `flatMapLatest`), or a value that can be recomputed lazily per subscriber, use `Flow` (cold) or `StateFlow`/`SharedFlow` (hot) — not a `Channel`, which delivers each element to exactly one receiver.

```kotlin
// Bridging a callback-based API into a Flow when you need multi-cast/operator support
fun sensorReadings(): Flow<Reading> = callbackFlow {
    val listener = SensorListener { reading -> trySend(reading) }
    sensor.register(listener)
    awaitClose { sensor.unregister(listener) }
}.shareIn(scope, SharingStarted.WhileSubscribed(), replay = 1)
```

## See Also

- [`flow-buffer-conflate-backpressure`](flow-buffer-conflate-backpressure.md) - Flow's own backpressure operators
- [`flow-statein-sharein`](flow-statein-sharein.md) - multi-casting a single producer to many collectors
- [`flow-cold-vs-hot`](flow-cold-vs-hot.md) - the cold/hot distinction underlying this choice
