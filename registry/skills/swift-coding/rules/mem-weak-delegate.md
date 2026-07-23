# mem-weak-delegate

> Mark delegate properties `weak` to avoid owner cycles

## Why It Matters

A delegate is almost always owned by the object it delegates *to* (a view controller owns the table view whose `dataSource`/`delegate` points back at it). If the delegate property is a strong reference, the two objects hold each other alive and neither ever deallocates. Marking the property `weak` matches the intended one-way ownership and lets the delegating object deallocate normally once its owner releases it.

## Bad

```swift
protocol UploadDelegate: AnyObject {
    func upload(_ manager: UploadManager, didFinish result: Result<URL, Error>)
}

final class UploadManager {
    var delegate: UploadDelegate?   // strong reference — cycle risk
}

final class UploadViewController: UploadDelegate {
    let manager = UploadManager()

    func start() {
        manager.delegate = self   // manager now strongly retains self, and self retains manager
    }

    func upload(_ manager: UploadManager, didFinish result: Result<URL, Error>) { /* ... */ }
}
```

## Good

```swift
protocol UploadDelegate: AnyObject {
    func upload(_ manager: UploadManager, didFinish result: Result<URL, Error>)
}

final class UploadManager {
    weak var delegate: UploadDelegate?
}

final class UploadViewController: UploadDelegate {
    let manager = UploadManager()

    func start() {
        manager.delegate = self   // no cycle: manager holds a weak reference
    }

    func upload(_ manager: UploadManager, didFinish result: Result<URL, Error>) { /* ... */ }
}
```

## Why the Protocol Must Be `AnyObject`-Constrained

`weak` only applies to reference types, so any delegate protocol needs a class-only constraint before a conforming property can be marked `weak`:

```swift
protocol UploadDelegate: AnyObject { }   // required for `weak var delegate: UploadDelegate?`
```

If a delegate-style callback needs to be a value type (a `struct` conforming to some protocol) instead, use a closure property (captured with the caller's own `[weak self]` discipline) rather than trying to force `weak` onto a non-class type.

## See Also

- [`mem-weak-self-closure`](mem-weak-self-closure.md) - the closure-capture analog of this problem
- [`mem-avoid-retain-cycle-timer`](mem-avoid-retain-cycle-timer.md) - another common owner-cycle source
- [`anti-retain-cycle-closure`](anti-retain-cycle-closure.md) - anti-pattern reference
