# anti-retain-cycle-closure

> Don't capture `self` strongly in stored escaping closures

## Why It Matters

When a class instance stores an escaping closure (a completion handler property, a subscription callback, a `Task` reference held as a property) and that closure captures `self` strongly, ARC creates a cycle the moment `self` also holds a reference back to the closure — which is exactly the situation for any stored closure property. Neither object's reference count can reach zero, so `deinit` never runs, and the leaked object (often a view controller or view model holding significant memory) accumulates silently across the app's lifetime, showing up only as a slow memory-usage climb that's hard to trace back to its source.

## Bad

```swift
final class DownloadManager {
    private var onProgress: ((Double) -> Void)?
    private let session = URLSession.shared

    func startDownload(url: URL) {
        onProgress = { progress in
            self.updateUI(progress: progress)   // strong capture — self is retained by its own closure
        }
        session.dataTask(with: url) { data, _, _ in
            self.handleData(data)               // strong capture again
            self.onProgress?(1.0)
        }.resume()
    }

    func updateUI(progress: Double) { /* ... */ }
    func handleData(_ data: Data?) { /* ... */ }
}
```

## Good

```swift
final class DownloadManager {
    private var onProgress: ((Double) -> Void)?
    private let session = URLSession.shared

    func startDownload(url: URL) {
        onProgress = { [weak self] progress in
            self?.updateUI(progress: progress)
        }
        session.dataTask(with: url) { [weak self] data, _, _ in
            guard let self else { return }
            self.handleData(data)
            self.onProgress?(1.0)
        }.resume()
    }

    func updateUI(progress: Double) { /* ... */ }
    func handleData(_ data: Data?) { /* ... */ }
}
```

## Detecting Existing Cycles

Verify a suspected leaked type actually deallocates by logging in `deinit` during development, or use Xcode's Memory Graph Debugger (Debug Navigator → Memory Graph) to inspect live object graphs for cycles directly — it will show the closure holding a strong reference back to the owning instance.

```swift
final class DownloadManager {
    deinit { print("DownloadManager deallocated") }  // should fire when expected; silence means a leak
}
```

## See Also

- [`mem-weak-self-closure`](mem-weak-self-closure.md) - the positive-form rule this anti-pattern violates
- [`mem-capture-list-explicit`](mem-capture-list-explicit.md) - document ownership intent for every capture
- [`mem-avoid-retain-cycle-timer`](mem-avoid-retain-cycle-timer.md) - the same cycle risk via `Timer`/`NotificationCenter`
- [`mem-deinit-verify`](mem-deinit-verify.md) - verifying deallocation to catch this class of bug
