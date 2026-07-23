# async-await-over-completion

> Prefer `async`/`await` over completion-handler callbacks

## Why It Matters

Completion-handler APIs force callers to manage nested closures, manually propagate errors through an `(Result<T, Error>) -> Void` parameter, and remember to call the handler exactly once on every path (easy to double-call or forget). `async`/`await` lets the compiler enforce single-resumption, reads top-to-bottom like synchronous code, and composes naturally with `throws`, `TaskGroup`, and structured cancellation.

## Bad

```swift
func fetchUser(id: String, completion: @escaping (Result<User, Error>) -> Void) {
    URLSession.shared.dataTask(with: userURL(id)) { data, response, error in
        if let error = error {
            completion(.failure(error))
            return
        }
        guard let data = data else {
            completion(.failure(APIError.noData))
            return
        }
        do {
            let user = try JSONDecoder().decode(User.self, from: data)
            completion(.success(user))
        } catch {
            completion(.failure(error))
        }
    }.resume()
}

func loadProfile(id: String) {
    fetchUser(id: id) { result in
        switch result {
        case .success(let user):
            self.fetchPosts(for: user) { postsResult in
                // nesting keeps growing...
            }
        case .failure(let error):
            self.showError(error)
        }
    }
}
```

## Good

```swift
func fetchUser(id: String) async throws -> User {
    let (data, _) = try await URLSession.shared.data(from: userURL(id))
    return try JSONDecoder().decode(User.self, from: data)
}

func loadProfile(id: String) async {
    do {
        let user = try await fetchUser(id: id)
        let posts = try await fetchPosts(for: user)
        render(user: user, posts: posts)
    } catch {
        showError(error)
    }
}
```

## Bridging Existing Completion-Handler APIs

When you can't rewrite a callback-based API, wrap it once with a checked continuation so the rest of the codebase can use `await` throughout:

```swift
func fetchUser(id: String) async throws -> User {
    try await withCheckedThrowingContinuation { continuation in
        legacyFetchUser(id: id) { result in
            continuation.resume(with: result)
        }
    }
}
```

## See Also

- [`async-continuation-bridge`](async-continuation-bridge.md) - the withCheckedContinuation pattern in depth
- [`async-structured-taskgroup`](async-structured-taskgroup.md) - run multiple async calls concurrently
- [`err-result-async-deferred`](err-result-async-deferred.md) - Result still has a place for stored/deferred outcomes
