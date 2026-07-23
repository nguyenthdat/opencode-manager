# async-sendable-closures

> Ensure closures crossing actor boundaries are `@Sendable`

## Why It Matters

A closure passed into `Task {}`, `TaskGroup.addTask`, or an actor/async API executes on a different concurrency context than where it was created, so anything it captures is effectively being shared across that boundary. `@Sendable` on the closure type requires the compiler to verify every captured value is safe to share (itself `Sendable`, or captured by value), catching data races at compile time instead of letting them surface as intermittent runtime corruption.

## Bad

```swift
final class ReportBuilder {
    var rows: [Row] = []   // Non-Sendable mutable reference state

    func buildAsync() {
        Task {
            // Capturing `self` (a non-Sendable class with mutable state)
            // into a task closure risks a race if buildAsync can be called
            // from multiple contexts concurrently.
            self.rows.append(contentsOf: try await fetchMoreRows())
        }
    }
}
```

## Good

```swift
actor ReportBuilder {
    private var rows: [Row] = []

    func buildAsync() {
        Task {
            // `self` here is an actor reference — Sendable by construction —
            // and the closure itself is @Sendable, checked by the compiler.
            let newRows = try await self.fetchMoreRows()
            await self.append(newRows)
        }
    }

    private func append(_ newRows: [Row]) {
        rows.append(contentsOf: newRows)
    }
}
```

## Declaring @Sendable on Your Own APIs

```swift
// Any function that hands a closure to a different concurrency domain
// should mark the parameter @Sendable so callers get the same checking
// your own code gets from Task {} and TaskGroup.
func runInBackground(_ work: @escaping @Sendable () async -> Void) {
    Task.detached {
        await work()
    }
}

// Capturing a value type is fine — structs of Sendable members are Sendable
struct Config: Sendable {
    let retryCount: Int
}

func schedule(_ config: Config) {
    runInBackground {
        print("Retrying up to \(config.retryCount) times")   // OK: Config is Sendable
    }
}
```

If a closure captures a non-`Sendable` reference type, the fix is usually to make the captured type an `actor`, convert it to a `Sendable` value type, or capture only the specific `Sendable` pieces of it you actually need instead of `self` wholesale.

## See Also

- [`async-sendable-conformance`](async-sendable-conformance.md) - the type-level conformance closures depend on
- [`mem-capture-list-explicit`](mem-capture-list-explicit.md) - being explicit about what a closure captures
- [`async-unstructured-task-scope`](async-unstructured-task-scope.md) - Task {} is the most common place this matters
