# anti-data-race-unchecked

> Don't disable strict concurrency checking to silence real races

## Why It Matters

`@unchecked Sendable` and `-strict-concurrency=minimal` are meant for narrow, deliberately audited cases — a type that's genuinely thread-safe via a mechanism the compiler can't see (manual locking, atomic operations) — not a way to make an inconvenient compiler error disappear. Slapping `@unchecked Sendable` on a class with genuinely unsynchronized mutable state doesn't fix the race; it just tells the compiler to stop warning about it, so the exact same data race that would have been a compile-time error instead becomes an intermittent, hard-to-reproduce runtime crash or corruption bug discovered much later, likely in production.

## Bad

```swift
// The class has real unsynchronized mutable state — @unchecked Sendable is a lie here.
final class RequestCache: @unchecked Sendable {
    private var storage: [String: Data] = [:]   // no lock, no actor isolation, no synchronization

    func store(_ data: Data, for key: String) {
        storage[key] = data       // called concurrently from multiple tasks — genuine data race
    }

    func data(for key: String) -> Data? {
        storage[key]
    }
}
```

## Good

```swift
// Real isolation: the actor enforces mutual exclusion, so Sendable is actually true.
actor RequestCache {
    private var storage: [String: Data] = [:]

    func store(_ data: Data, for key: String) {
        storage[key] = data
    }

    func data(for key: String) -> Data? {
        storage[key]
    }
}
```

## When `@unchecked Sendable` Is Legitimate

Reserve it for types that are provably thread-safe through a mechanism the compiler genuinely cannot verify — e.g., an `NSLock`-protected value type, or a wrapper around a C library that's documented as thread-safe — and pair it with a comment explaining exactly what makes it safe, so the exception is auditable rather than a silent escape hatch:

```swift
// Genuinely thread-safe: all access goes through `lock`, verified in code review.
// Not an actor because this type must stay usable from synchronous, non-async call sites.
final class ThreadSafeCounter: @unchecked Sendable {
    private let lock = NSLock()
    private var _value = 0

    var value: Int {
        lock.lock(); defer { lock.unlock() }
        return _value
    }

    func increment() {
        lock.lock(); defer { lock.unlock() }
        _value += 1
    }
}
```

## See Also

- [`async-sendable-conformance`](async-sendable-conformance.md) - the positive-form rule this anti-pattern violates
- [`lint-strict-concurrency-complete`](lint-strict-concurrency-complete.md) - enabling the checks this anti-pattern disables
- [`async-actor-isolated-state`](async-actor-isolated-state.md) - the correct tool (actor isolation) instead of `@unchecked Sendable`
- [`lint-analyze-build`](lint-analyze-build.md) - Thread Sanitizer as a runtime backstop for races the compiler misses
