# mem-avoid-retain-cycle-timer

> Break Timer/NotificationCenter observer retain cycles

## Why It Matters

`Timer.scheduledTimer` and block-based `NotificationCenter.addObserver` both retain their closure (and whatever it captures) for as long as the timer is scheduled or the observer is registered. If the closure captures `self` strongly and `self` also owns the timer/observer, the object can never deallocate: the timer keeps `self` alive, and `self` keeps the timer running, forever, even after the screen or feature that created it is gone.

## Bad

```swift
final class DashboardViewController: UIViewController {
    var timer: Timer?

    override func viewDidLoad() {
        super.viewDidLoad()
        timer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { _ in
            self.refresh()   // strong capture keeps self alive as long as the timer runs
        }
        NotificationCenter.default.addObserver(
            forName: .appDidBecomeActive, object: nil, queue: .main
        ) { _ in
            self.refresh()   // same problem: observer block retains self indefinitely
        }
    }

    func refresh() { /* ... */ }
    // timer never invalidated, observer never removed — both leak `self`
}
```

## Good

```swift
final class DashboardViewController: UIViewController {
    var timer: Timer?
    private var appActiveObserver: NSObjectProtocol?

    override func viewDidLoad() {
        super.viewDidLoad()
        timer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in
            self?.refresh()
        }
        appActiveObserver = NotificationCenter.default.addObserver(
            forName: .appDidBecomeActive, object: nil, queue: .main
        ) { [weak self] _ in
            self?.refresh()
        }
    }

    func refresh() { /* ... */ }

    deinit {
        timer?.invalidate()
        if let appActiveObserver {
            NotificationCenter.default.removeObserver(appActiveObserver)
        }
    }
}
```

## Preferring Structured Alternatives

Where possible, replace both patterns with structured concurrency, which cancels automatically with the owning task's lifetime and avoids the capture question entirely:

```swift
final class DashboardModel {
    func startPolling() -> Task<Void, Never> {
        Task { [weak self] in
            while !Task.isCancelled {
                self?.refresh()
                try? await Task.sleep(for: .seconds(5))
            }
        }
    }

    func refresh() { /* ... */ }
}
```

## See Also

- [`mem-weak-self-closure`](mem-weak-self-closure.md) - the general escaping-closure capture rule
- [`mem-deinit-verify`](mem-deinit-verify.md) - confirming the cycle is actually broken
- [`async-task-cancel-cleanup`](async-task-cancel-cleanup.md) - cancelling structured replacements for timers/observers
