# async-actor-isolated-state

> Use `actor` to isolate mutable shared state

## Why It Matters

Mutable state accessed from multiple concurrent tasks is a classic source of data races — two tasks reading-modifying-writing a shared dictionary or counter can interleave and corrupt it, and the compiler can't catch it with a plain `class`. An `actor` serializes access to its mutable state automatically: only one task can execute inside the actor at a time, and every access from outside must go through `await`, making the isolation boundary visible and compiler-checked.

## Bad

```swift
final class RequestCounter {
    private var counts: [String: Int] = [:]

    func increment(_ key: String) {
        counts[key, default: 0] += 1   // Data race if called from multiple tasks concurrently
    }

    func count(for key: String) -> Int {
        counts[key] ?? 0
    }
}

// Called from many concurrent tasks — undefined behavior under strict concurrency,
// and a real, silent race in practice (dropped increments, crashes).
let counter = RequestCounter()
for _ in 0..<100 {
    Task { counter.increment("api") }
}
```

## Good

```swift
actor RequestCounter {
    private var counts: [String: Int] = [:]

    func increment(_ key: String) {
        counts[key, default: 0] += 1   // Safe: actor serializes all access
    }

    func count(for key: String) -> Int {
        counts[key] ?? 0
    }
}

let counter = RequestCounter()
for _ in 0..<100 {
    Task { await counter.increment("api") }
}

let total = await counter.count(for: "api")
```

## Actors and Value Types Inside

```swift
actor ImageCache {
    private var storage: [URL: UIImage] = [:]

    func image(for url: URL) -> UIImage? {
        storage[url]
    }

    func store(_ image: UIImage, for url: URL) {
        storage[url] = image
    }

    // Async work inside an actor method still only runs one call at a time
    // between suspension points — see async-actor-reentrancy for the nuance.
    func loadAndCache(_ url: URL) async throws -> UIImage {
        if let cached = storage[url] { return cached }
        let image = try await download(url)
        storage[url] = image
        return image
    }
}
```

Every actor method call from outside the actor is an implicit suspension point (`await`), so callers must be in an async context — this is the compiler's way of making the isolation boundary impossible to ignore.

## See Also

- [`async-actor-reentrancy`](async-actor-reentrancy.md) - actors are not fully exclusive across await points
- [`async-sendable-conformance`](async-sendable-conformance.md) - values crossing into/out of an actor must be Sendable
- [`async-nonisolated-pure`](async-nonisolated-pure.md) - opt specific members out of actor isolation
- [`async-mainactor-ui`](async-mainactor-ui.md) - the specialized global actor for UI state
