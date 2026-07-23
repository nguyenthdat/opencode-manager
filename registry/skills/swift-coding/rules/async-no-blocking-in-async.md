# async-no-blocking-in-async

> Never call blocking APIs inside `async` functions

## Why It Matters

Swift's cooperative thread pool runs async work on a small, fixed number of threads. A blocking call inside an `async` function — synchronous I/O, `Thread.sleep`, a blocking semaphore wait, or a long CPU-bound loop with no `await` — occupies one of those threads without yielding it back, which can starve the pool and stall every other task in the app, not just the one that misbehaved.

## Bad

```swift
func loadConfig() async throws -> Config {
    // Synchronous, blocking file I/O on a cooperative-pool thread —
    // blocks that thread for the whole read instead of yielding.
    let data = try Data(contentsOf: configURL)
    return try JSONDecoder().decode(Config.self, from: data)
}

func waitForSignal() async {
    let semaphore = DispatchSemaphore(value: 0)
    backgroundQueue.async { semaphore.signal() }
    semaphore.wait()   // Blocks the thread; can deadlock the cooperative pool entirely
}
```

## Good

```swift
func loadConfig() async throws -> Config {
    // Run blocking I/O off the cooperative pool, on a dedicated thread
    let data = try await Task.detached(priority: .utility) {
        try Data(contentsOf: configURL)
    }.value
    return try JSONDecoder().decode(Config.self, from: data)
}

func waitForSignal() async {
    await withCheckedContinuation { continuation in
        backgroundQueue.async {
            continuation.resume()   // Suspends the task instead of blocking a thread
        }
    }
}
```

## Recognizing Blocking APIs to Avoid in async Code

```swift
// Blocking — avoid inside async functions:
// Thread.sleep(forTimeInterval:), DispatchSemaphore.wait(),
// synchronous FileManager/Data(contentsOf:) on large files,
// URLSession's synchronous (non-async) APIs, NSLock.lock() held a long time.

// Non-blocking replacements:
try await Task.sleep(for: .seconds(1))          // instead of Thread.sleep
try await URLSession.shared.data(from: url)     // instead of synchronous data(contentsOf:)
try await withCheckedContinuation { ... }        // instead of a semaphore wait
```

If blocking work is unavoidable (legacy library, heavy CPU work), isolate it on `Task.detached` with an appropriate `priority`, or move it to a dedicated `DispatchQueue`/`Thread` and bridge back with a continuation — never leave it running directly on an `async` function's inherited execution context.

## See Also

- [`async-continuation-bridge`](async-continuation-bridge.md) - bridging blocking/callback APIs safely
- [`async-unstructured-task-scope`](async-unstructured-task-scope.md) - Task.detached and its tradeoffs
- [`anti-blocking-main-thread`](anti-blocking-main-thread.md) - the specific, especially harmful case of blocking the main actor
