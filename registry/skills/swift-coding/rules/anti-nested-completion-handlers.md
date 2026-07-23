# anti-nested-completion-handlers

> Don't nest completion-handler pyramids; migrate to async/await

## Why It Matters

Chaining several completion-handler-based async calls produces a "pyramid of doom" where each callback nests one level deeper than the last, error handling is duplicated at every level (or worse, skipped at some), and the actual control flow — "do A, then B, then C" — is buried inside layers of closures instead of reading top to bottom. `async`/`await` collapses the same sequential logic into linear, straight-line code with a single `do`/`catch` for error handling, and eliminates an entire category of bugs where a completion handler is called twice, never called, or called on the wrong queue.

## Bad

```swift
func loadDashboard(userID: String, completion: @escaping (Result<Dashboard, Error>) -> Void) {
    fetchUser(id: userID) { userResult in
        switch userResult {
        case .success(let user):
            self.fetchOrders(userID: user.id) { ordersResult in
                switch ordersResult {
                case .success(let orders):
                    self.fetchRecommendations(for: user) { recsResult in
                        switch recsResult {
                        case .success(let recs):
                            completion(.success(Dashboard(user: user, orders: orders, recommendations: recs)))
                        case .failure(let error):
                            completion(.failure(error))
                        }
                    }
                case .failure(let error):
                    completion(.failure(error))
                }
            }
        case .failure(let error):
            completion(.failure(error))
        }
    }
}
```

## Good

```swift
func loadDashboard(userID: String) async throws -> Dashboard {
    let user = try await fetchUser(id: userID)
    async let orders = fetchOrders(userID: user.id)
    async let recommendations = fetchRecommendations(for: user)
    return try await Dashboard(user: user, orders: orders, recommendations: recommendations)
    // sequential logic reads top-to-bottom; independent fetches run concurrently via `async let`
}
```

## Bridging a Legacy Callback API During Migration

When a dependency still only exposes completion handlers, wrap it once with `withCheckedThrowingContinuation` so the rest of the codebase can adopt `async`/`await` even before the underlying API is migrated:

```swift
func fetchUser(id: String) async throws -> User {
    try await withCheckedThrowingContinuation { continuation in
        legacyClient.fetchUser(id: id) { result in
            continuation.resume(with: result)
        }
    }
}
```

## See Also

- [`async-await-over-completion`](async-await-over-completion.md) - the positive-form rule this anti-pattern violates
- [`async-continuation-bridge`](async-continuation-bridge.md) - wrapping legacy callback APIs during incremental migration
- [`async-let-parallel`](async-let-parallel.md) - running independent steps concurrently instead of sequentially nesting them
- [`anti-blocking-main-thread`](anti-blocking-main-thread.md) - another symptom of avoiding structured concurrency
