# async-task-cancellation-check

> Check `Task.isCancelled`/`Task.checkCancellation()` in long work

## Why It Matters

Swift concurrency's cancellation is cooperative: calling `.cancel()` on a `Task` just flips a flag — it does not stop execution. A long-running loop or computation that never checks `Task.isCancelled` (or calls a `throw`ing `Task.checkCancellation()`) will keep consuming CPU, network, or battery long after the caller gave up and moved on, defeating the entire point of cancellation.

## Bad

```swift
func processLargeDataset(_ items: [Item]) async throws -> [Result] {
    var results: [Result] = []
    for item in items {
        // If the enclosing Task is cancelled, this keeps grinding through
        // all 100,000 items anyway, wasting time and resources.
        results.append(try await expensiveTransform(item))
    }
    return results
}
```

## Good

```swift
func processLargeDataset(_ items: [Item]) async throws -> [Result] {
    var results: [Result] = []
    for item in items {
        try Task.checkCancellation()   // Throws CancellationError if cancelled
        results.append(try await expensiveTransform(item))
    }
    return results
}

// Or, when you want to return partial results instead of throwing
func processBestEffort(_ items: [Item]) async -> [Result] {
    var results: [Result] = []
    for item in items {
        if Task.isCancelled { break }
        if let result = try? await expensiveTransform(item) {
            results.append(result)
        }
    }
    return results
}
```

## Cancellation-Aware Polling Loops

```swift
func pollUntilReady(_ jobID: String) async throws -> JobResult {
    while true {
        try Task.checkCancellation()

        let status = try await checkStatus(jobID)
        if case .completed(let result) = status {
            return result
        }
        try await Task.sleep(for: .seconds(2))
        // Task.sleep itself throws CancellationError promptly when cancelled,
        // so this loop exits quickly even without an explicit check above —
        // but checking explicitly documents intent and covers non-sleeping paths.
    }
}
```

Check cancellation at natural iteration boundaries in loops, and before starting each expensive unit of work — not necessarily on every single line, which would add unnecessary overhead.

## See Also

- [`async-task-cancel-cleanup`](async-task-cancel-cleanup.md) - cancel tasks explicitly and clean up resources
- [`async-structured-taskgroup`](async-structured-taskgroup.md) - task groups propagate cancellation to children automatically
- [`err-throws-try-propagate`](err-throws-try-propagate.md) - CancellationError propagates like any other thrown error
