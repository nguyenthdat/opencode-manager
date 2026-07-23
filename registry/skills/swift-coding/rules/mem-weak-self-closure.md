# mem-weak-self-closure

> Capture `[weak self]` in escaping closures to avoid retain cycles

## Why It Matters

An escaping closure stored by a class instance (as a completion handler, `Task`, or Combine sink) that captures `self` strongly creates a reference cycle whenever `self` also (directly or transitively) holds a reference back to that closure. ARC cannot break the cycle, so both objects leak and `deinit` never runs. Capturing `[weak self]` breaks the cycle while still letting the closure safely check whether `self` is still alive when it eventually executes.

## Bad

```swift
final class ProfileLoader {
    private let session = URLSession.shared
    private var onLoad: (() -> Void)?

    func loadProfile(id: String) {
        onLoad = {
            self.applyCache(for: id)   // strong capture of self
        }
        session.dataTask(with: profileURL(id)) { data, _, _ in
            self.handle(data)          // strong capture of self
            self.onLoad?()
        }.resume()
    }

    func applyCache(for id: String) { /* ... */ }
    func handle(_ data: Data?) { /* ... */ }
}
```

## Good

```swift
final class ProfileLoader {
    private let session = URLSession.shared
    private var onLoad: (() -> Void)?

    func loadProfile(id: String) {
        onLoad = { [weak self] in
            self?.applyCache(for: id)
        }
        session.dataTask(with: profileURL(id)) { [weak self] data, _, _ in
            guard let self else { return }
            self.handle(data)
            self.onLoad?()
        }.resume()
    }

    func applyCache(for id: String) { /* ... */ }
    func handle(_ data: Data?) { /* ... */ }
}
```

## When Strong Capture Is Fine

Non-escaping closures (`map`, `filter`, `withTaskGroup` bodies, most synchronous higher-order functions) never outlive the call that receives them, so they cannot form a cycle — capture `self` strongly there for clarity:

```swift
struct ReportBuilder {
    let items: [Item]

    func summaries() -> [String] {
        items.map { self.summarize($0) }   // non-escaping: safe and clearer
    }

    func summarize(_ item: Item) -> String { item.name }
}
```

Also prefer strong capture for short-lived, fire-once closures where the enclosing object's lifetime is guaranteed to extend past completion (e.g. a one-shot closure passed to a `Task` whose result the caller `await`s immediately).

## See Also

- [`mem-capture-list-explicit`](mem-capture-list-explicit.md) - document ownership intent for every capture
- [`mem-avoid-retain-cycle-timer`](mem-avoid-retain-cycle-timer.md) - the same cycle risk for Timer/NotificationCenter
- [`anti-retain-cycle-closure`](anti-retain-cycle-closure.md) - anti-pattern reference
- [`mem-weak-delegate`](mem-weak-delegate.md) - the delegate-property analog of this problem
