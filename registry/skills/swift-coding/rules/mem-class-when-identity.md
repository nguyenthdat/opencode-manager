# mem-class-when-identity

> Use `class` only when reference identity or shared mutation is required

## Why It Matters

Some concepts are fundamentally about identity — a network connection, a shared cache, a view model observed by several SwiftUI views — where every observer must see the same mutable instance, not an independent copy. Modeling these as `struct` either loses that shared mutation (each copy drifts independently) or forces awkward workarounds like wrapping the struct in a class anyway. Choosing `class` deliberately, rather than by habit, keeps the rest of the codebase defaulting to safer value types.

## Bad

```swift
// A download progress tracker modeled as a struct: every observer
// gets its own copy, so updates never propagate.
struct DownloadTask {
    var bytesReceived: Int = 0
    var totalBytes: Int

    mutating func receive(_ bytes: Int) {
        bytesReceived += bytes
    }
}

let task = DownloadTask(totalBytes: 1_000)
var uiCopy = task
uiCopy.receive(500)
// `task` still shows 0 bytes received — the "shared" tracker isn't shared at all.
```

## Good

```swift
@Observable
final class DownloadTask {
    private(set) var bytesReceived = 0
    let totalBytes: Int

    init(totalBytes: Int) { self.totalBytes = totalBytes }

    func receive(_ bytes: Int) {
        bytesReceived += bytes
    }
}

let task = DownloadTask(totalBytes: 1_000)
let uiReference = task   // same instance
uiReference.receive(500)
// task.bytesReceived is 500 too — identity is shared as intended
```

## Checklist Before Reaching for `class`

Justify the choice against value semantics first; a class is warranted when at least one is true:

- Multiple parts of the app must observe or mutate the *same* instance (shared cache, connection, SwiftUI `@Observable` model).
- The type has an inherent, mutable lifecycle independent of any single owner (a file handle, a socket).
- You need `deinit` to run cleanup when the last reference goes away.
- Reference identity itself is meaningful (`===` comparisons matter, e.g. distinguishing two logically-equal-but-distinct sessions).

If none apply, default to `struct`/`enum` per `mem-struct-value-semantics`.

## See Also

- [`mem-struct-value-semantics`](mem-struct-value-semantics.md) - the default to justify deviating from
- [`mem-final-class-default`](mem-final-class-default.md) - once you choose class, close it to subclassing by default
- [`ui-state-source-of-truth`](ui-state-source-of-truth.md) - shared observed state in SwiftUI
- [`mem-deinit-verify`](mem-deinit-verify.md) - confirming the class's lifecycle actually behaves as designed
