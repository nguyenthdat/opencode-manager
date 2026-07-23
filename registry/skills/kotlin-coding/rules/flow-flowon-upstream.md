# flow-flowon-upstream

> Use `flowOn` to change the dispatcher upstream of it, not downstream

## Why It Matters

`flowOn` only affects operators *above* (upstream of) where it's placed in the chain — everything below it still runs on whatever dispatcher the collector is using. Placing `flowOn` in the wrong spot, or expecting it to affect `collect`, leads to blocking calls silently running on the collector's dispatcher (often the UI thread) instead of the intended background one.

## Bad

```kotlin
fun loadItems(): Flow<Item> = flow {
    emit(database.queryBlocking()) // blocking DB call, needs Dispatchers.IO
}
    .filter { it.isValid }
    .map { transform(it) }
    .flowOn(Dispatchers.IO) // BAD: placed at the very end - only the flow{} builder
                            // above benefits; filter/map already ran on the collector's
                            // own dispatcher before this line ever took effect

// A different mistake: expecting flowOn to affect the collector itself
scope.launch(Dispatchers.Main) {
    loadItems()
        .flowOn(Dispatchers.IO)
        .collect { renderBlockingly(it) } // BAD: collect always runs on the collector's
                                          // own dispatcher (Main here); flowOn cannot change that
}
```

## Good

```kotlin
fun loadItems(): Flow<Item> = flow {
    emit(database.queryBlocking()) // blocking DB call, needs Dispatchers.IO
}
    .map { transform(it) }         // CPU work, fine to run wherever flowOn puts it
    .flowOn(Dispatchers.IO)        // affects flow{} and map{} above; below is unaffected
    .filter { it.isValid }         // runs on the collector's dispatcher, not IO

scope.launch(Dispatchers.Main) {
    loadItems().collect { item ->
        updateUi(item) // correctly still runs on Main, since collect uses the caller's context
    }
}
```

## Mental Model

Think of `flowOn` as a wall: everything written above it in the chain moves to the new dispatcher; everything below (including `collect` itself) stays on the original dispatcher. If you need blocking work done just before collection, put `flowOn` immediately after that operator, not at the very end of the chain.

```kotlin
fun search(query: String): Flow<List<Result>> =
    flow { emit(blockingSearch(query)) } // needs IO
        .flowOn(Dispatchers.IO)          // wall here
        .onEach { analytics.log(it) }    // runs on collector's dispatcher
```

Multiple `flowOn` calls in one chain each apply to the segment directly above them, letting different stages run on different dispatchers.

## See Also

- [`flow-cancellable-collect`](flow-cancellable-collect.md) - where collect actually executes
- [`async-dispatchers-choice`](async-dispatchers-choice.md) - picking the dispatcher passed to flowOn
- [`flow-buffer-conflate-backpressure`](flow-buffer-conflate-backpressure.md) - flowOn introduces a buffer by default
