# async-structured-taskgroup

> Use `TaskGroup`/`withThrowingTaskGroup` for structured concurrency

## Why It Matters

`TaskGroup` runs a dynamic number of child tasks concurrently while guaranteeing the parent scope doesn't exit until every child has finished (or been cancelled) — no leaked tasks, no forgotten awaits. It's the right tool when the number of concurrent operations isn't known at compile time (unlike `async let`, which is fixed), and `withThrowingTaskGroup` propagates the first error while automatically cancelling the remaining children.

## Bad

```swift
func fetchAll(_ ids: [String]) async throws -> [User] {
    var users: [User] = []
    for id in ids {
        // Sequential — each fetch waits for the previous one to finish,
        // even though they're all independent network calls.
        users.append(try await fetchUser(id: id))
    }
    return users
}
```

## Good

```swift
func fetchAll(_ ids: [String]) async throws -> [User] {
    try await withThrowingTaskGroup(of: User.self) { group in
        for id in ids {
            group.addTask {
                try await fetchUser(id: id)
            }
        }
        var users: [User] = []
        for try await user in group {
            users.append(user)
        }
        return users
    }
}
```

## Collecting Results Without Failing Fast

```swift
func fetchAllTolerant(_ ids: [String]) async -> [Result<User, Error>] {
    await withTaskGroup(of: Result<User, Error>.self) { group in
        for id in ids {
            group.addTask {
                do {
                    return .success(try await fetchUser(id: id))
                } catch {
                    return .failure(error)
                }
            }
        }
        var results: [Result<User, Error>] = []
        for await result in group {
            results.append(result)
        }
        return results
    }
}

// Limiting concurrency: add tasks in a bounded window
func fetchThrottled(_ ids: [String], maxConcurrent: Int) async throws -> [User] {
    try await withThrowingTaskGroup(of: User.self) { group in
        var iterator = ids.makeIterator()
        var users: [User] = []

        for _ in 0..<maxConcurrent {
            if let id = iterator.next() {
                group.addTask { try await fetchUser(id: id) }
            }
        }
        while let user = try await group.next() {
            users.append(user)
            if let id = iterator.next() {
                group.addTask { try await fetchUser(id: id) }
            }
        }
        return users
    }
}
```

If a child task throws inside `withThrowingTaskGroup`, the group automatically cancels its siblings and the first error propagates out — you don't need to manually cancel the rest.

## See Also

- [`async-let-parallel`](async-let-parallel.md) - use for a fixed, small number of parallel calls
- [`async-task-cancellation-check`](async-task-cancellation-check.md) - cooperative cancellation inside child tasks
- [`async-sendable-conformance`](async-sendable-conformance.md) - values crossing into child tasks must be Sendable
