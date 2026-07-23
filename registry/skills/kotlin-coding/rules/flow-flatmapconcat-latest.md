# flow-flatmapconcat-latest

> Pick `flatMapConcat`/`flatMapMerge`/`flatMapLatest` based on required concurrency semantics

## Why It Matters

Each `flatMap` variant handles overlapping inner flows completely differently — sequential, concurrent, or cancel-and-replace — and picking the wrong one silently changes correctness, not just performance: `flatMapMerge` can interleave results out of order, `flatMapLatest` can cancel work you needed to finish, and `flatMapConcat` can serialize independent work that should have overlapped.

## Bad

```kotlin
fun searchResults(queries: Flow<String>): Flow<List<Result>> =
    queries.flatMapMerge { query ->
        // BAD: results for an old, superseded query can arrive after a newer query's
        // results, showing stale search results in the UI momentarily
        flow { emit(api.search(query)) }
    }
```

## Good

```kotlin
fun searchResults(queries: Flow<String>): Flow<List<Result>> =
    queries.flatMapLatest { query ->
        // GOOD: a new query cancels the in-flight search for the previous one
        flow { emit(api.search(query)) }
    }
```

## Choosing the Right Operator

```kotlin
// flatMapConcat: process inner flows one at a time, in order - use when order
// and full completion of each item matter (e.g. sequential file processing)
fun processInOrder(files: Flow<File>): Flow<Result> =
    files.flatMapConcat { file -> flow { emit(process(file)) } }

// flatMapMerge: run inner flows concurrently, interleave as they complete - use
// for independent work where order doesn't matter and throughput does
fun fetchAllConcurrently(ids: Flow<String>): Flow<User> =
    ids.flatMapMerge(concurrency = 8) { id -> flow { emit(api.fetchUser(id)) } }

// flatMapLatest: cancel the previous inner flow when a new value arrives - use
// for "only the newest request matters" scenarios like live search-as-you-type
fun liveSearch(queries: Flow<String>): Flow<List<Result>> =
    queries.flatMapLatest { query -> flow { emit(api.search(query)) } }
```

## Rule of Thumb

- Need every result, in order, one at a time: `flatMapConcat`.
- Need every result, don't care about order, want concurrency: `flatMapMerge`.
- Only the most recent input's result matters, stale work should be cancelled: `flatMapLatest`.

## See Also

- [`flow-buffer-conflate-backpressure`](flow-buffer-conflate-backpressure.md) - collectLatest applies the same cancel-on-new-value idea outside flatMap
- [`async-async-await-parallel`](async-async-await-parallel.md) - the async equivalent of flatMapMerge's concurrency
- [`flow-cold-vs-hot`](flow-cold-vs-hot.md) - background on how inner flows are subscribed and cancelled
