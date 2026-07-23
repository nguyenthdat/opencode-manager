# async-continuation-bridge

> Use `withCheckedContinuation` to bridge legacy callback APIs

## Why It Matters

`withCheckedContinuation`/`withCheckedThrowingContinuation` convert a completion-handler-based API into a single `await`-able call by suspending the current task until the continuation is resumed. This lets you incrementally migrate a codebase to `async`/`await` from the outside in — wrapping legacy callback APIs at the boundary — without waiting for every dependency to expose native async APIs. The "checked" variant also detects (in debug builds) double-resumes and never-resumed continuations, which are otherwise silent bugs.

## Bad

```swift
func fetchToken(completion: @escaping (String?, Error?) -> Void) {
    legacyAuthSDK.getToken { token, error in
        completion(token, error)
    }
}

func login() {
    // Back to callback-hell to consume a callback API from async code
    fetchToken { token, error in
        guard let token = token else { return }
        Task {
            try? await self.signIn(token: token)
        }
    }
}
```

## Good

```swift
func fetchToken() async throws -> String {
    try await withCheckedThrowingContinuation { continuation in
        legacyAuthSDK.getToken { token, error in
            if let error = error {
                continuation.resume(throwing: error)
            } else if let token = token {
                continuation.resume(returning: token)
            } else {
                continuation.resume(throwing: AuthError.noToken)
            }
        }
    }
}

func login() async throws {
    let token = try await fetchToken()
    try await signIn(token: token)
}
```

## Resuming Exactly Once

```swift
func withTimeout<T>(_ seconds: Double, operation: @escaping () -> Void, provide: @escaping (T) -> Void) async -> T? {
    await withCheckedContinuation { continuation in
        var didResume = false
        let lock = NSLock()

        func resumeOnce(_ value: T?) {
            lock.lock()
            defer { lock.unlock() }
            guard !didResume else { return }
            didResume = true
            continuation.resume(returning: value)
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + seconds) {
            resumeOnce(nil)
        }
        provide { value in resumeOnce(value) }
    }
}
```

A continuation must be resumed exactly once on every code path — the checked variants will trap in debug builds if you resume zero or multiple times, which is exactly the class of bug this rule exists to catch early. Use `withUnsafeContinuation` only after you've proven correctness and need to remove the (small) runtime check overhead.

## See Also

- [`async-await-over-completion`](async-await-over-completion.md) - the migration this bridge enables
- [`err-result-async-deferred`](err-result-async-deferred.md) - continuation.resume(with:) accepts a Result directly
- [`async-no-blocking-in-async`](async-no-blocking-in-async.md) - bridging is the safe alternative to blocking waits
