# async-sendable-conformance

> Conform cross-task types to `Sendable`

## Why It Matters

`Sendable` marks a type as safe to share across concurrency domains (tasks, actors, threads) without data races — either because it's a value type with no shared mutable storage, or because it internally synchronizes access. Under Swift's strict concurrency checking, passing a non-`Sendable` type across a `Task {}` boundary or into an actor is a compile error (or a warning, pre-Swift 6), because the compiler can't prove it's safe.

## Bad

```swift
final class UploadProgress {
    var bytesSent: Int = 0   // Mutable, unsynchronized, shared reference type
}

func upload(_ data: Data) {
    let progress = UploadProgress()
    Task {
        // Error under strict concurrency: UploadProgress is not Sendable,
        // so sharing this mutable reference across the task boundary is unsafe.
        progress.bytesSent = data.count
    }
}
```

## Good

```swift
// Option 1: make it a value type — structs with Sendable members are
// Sendable automatically, and value semantics avoid shared mutable state.
struct UploadProgress: Sendable {
    var bytesSent: Int
}

// Option 2: keep it a reference type but isolate mutation in an actor
actor UploadProgressTracker {
    private(set) var bytesSent: Int = 0
    func record(_ count: Int) {
        bytesSent += count
    }
}

func upload(_ data: Data) {
    let tracker = UploadProgressTracker()
    Task {
        await tracker.record(data.count)
    }
}
```

## @unchecked Sendable — Use Sparingly

```swift
// Only when you've manually verified thread-safety (e.g. an internal lock)
// and the compiler simply can't see it.
final class ThreadSafeCache: @unchecked Sendable {
    private let lock = NSLock()
    private var storage: [String: Data] = [:]

    func value(for key: String) -> Data? {
        lock.lock()
        defer { lock.unlock() }
        return storage[key]
    }
}
```

`@unchecked Sendable` disables compiler checking entirely — it's a promise you're making, not a proof. Reach for a real `actor` first; use `@unchecked` only for types with hand-verified internal synchronization (locks, `DispatchQueue` barriers) that the compiler has no way to see through.

## See Also

- [`async-actor-isolated-state`](async-actor-isolated-state.md) - the preferred way to isolate mutable state
- [`async-sendable-closures`](async-sendable-closures.md) - closures crossing boundaries need @Sendable too
- [`async-strict-concurrency-migration`](async-strict-concurrency-migration.md) - rolling this out across an existing codebase
- [`mem-struct-value-semantics`](mem-struct-value-semantics.md) - value types are the easiest path to Sendable
