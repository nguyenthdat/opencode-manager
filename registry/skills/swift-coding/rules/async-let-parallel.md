# async-let-parallel

> Use `async let` for parallel independent work

## Why It Matters

`async let` starts a child task immediately and lets you await its result later, so a fixed, known number of independent async calls can run concurrently with almost no ceremony — none of the boilerplate a `TaskGroup` requires. Writing sequential `await` calls for operations that don't depend on each other wastes wall-clock time for no benefit; `async let` is the lightest-weight fix.

## Bad

```swift
func loadDashboard() async throws -> Dashboard {
    // These three calls are independent, but awaiting them one at a time
    // makes total time = sum of all three, not the slowest one.
    let profile = try await fetchProfile()
    let feed = try await fetchFeed()
    let notifications = try await fetchNotifications()
    return Dashboard(profile: profile, feed: feed, notifications: notifications)
}
```

## Good

```swift
func loadDashboard() async throws -> Dashboard {
    async let profile = fetchProfile()
    async let feed = fetchFeed()
    async let notifications = fetchNotifications()

    // All three run concurrently; awaiting collects results once each finishes
    return try await Dashboard(
        profile: profile,
        feed: feed,
        notifications: notifications
    )
}
```

## Cancellation and Error Propagation

```swift
func loadDashboard() async throws -> Dashboard {
    async let profile = fetchProfile()
    async let feed = fetchFeed()

    // If `feed` throws first, `profile`'s child task is automatically
    // cancelled when this scope exits — you don't need to cancel it manually.
    do {
        return try await Dashboard(profile: profile, feed: feed, notifications: [])
    } catch {
        throw DashboardError.loadFailed(error)
    }
}

// If you don't need the error to propagate, use try? per binding
func loadDashboardBestEffort() async -> Dashboard {
    async let profile = try? fetchProfile()
    async let feed = try? fetchFeed()
    return await Dashboard(profile: profile ?? .empty, feed: feed ?? [], notifications: [])
}
```

Use `async let` when the set of concurrent operations is small and known at compile time; switch to `TaskGroup` once the number of concurrent tasks becomes dynamic (e.g. one per element of an array).

## See Also

- [`async-structured-taskgroup`](async-structured-taskgroup.md) - use for a dynamic number of concurrent tasks
- [`async-await-over-completion`](async-await-over-completion.md) - the async/await foundation this builds on
- [`async-task-cancellation-check`](async-task-cancellation-check.md) - understand how cancellation propagates to async let children
