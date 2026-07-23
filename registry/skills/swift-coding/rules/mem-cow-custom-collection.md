# mem-cow-custom-collection

> Implement copy-on-write for custom value-type collections

## Why It Matters

Swift's built-in collections (`Array`, `Dictionary`, `Set`) are cheap to copy because they share one storage buffer until a mutation actually happens, then copy only at that point. A custom value-type collection that doesn't implement the same copy-on-write (COW) scheme either copies its entire backing storage on every assignment (wasteful) or, worse, wraps a reference type without isolating storage and accidentally shares mutable state between "copies" (a value-semantics bug).

## Bad

```swift
struct Matrix {
    private var storage: [[Double]]   // reference-backed array of arrays

    init(rows: Int, columns: Int) {
        storage = Array(repeating: Array(repeating: 0, count: columns), count: rows)
    }

    // No COW: this looks like value semantics, but `storage` is deep-copied
    // on every single assignment even when nothing mutates — no sharing at all.
    mutating func set(_ value: Double, row: Int, col: Int) {
        storage[row][col] = value
    }
}
```

## Good

```swift
struct Matrix {
    private final class Storage {
        var rows: [[Double]]
        init(rows: [[Double]]) { self.rows = rows }
        func copy() -> Storage { Storage(rows: rows) }
    }

    private var storage: Storage

    init(rows: Int, columns: Int) {
        storage = Storage(rows: Array(repeating: Array(repeating: 0, count: columns), count: rows))
    }

    private var isKnownUniquelyReferencedStorage: Bool {
        mutating get { isKnownUniquelyReferenced(&storage) }
    }

    mutating func set(_ value: Double, row: Int, col: Int) {
        if !isKnownUniquelyReferencedStorage {
            storage = storage.copy()   // copy only when another value shares this buffer
        }
        storage.rows[row][col] = value
    }

    subscript(row: Int, col: Int) -> Double {
        storage.rows[row][col]
    }
}

var a = Matrix(rows: 2, columns: 2)
var b = a          // cheap: shares storage, no copy yet
b.set(1, row: 0, col: 0)   // triggers copy here; `a` is untouched
```

## When Plain Value Semantics Is Enough

Skip custom COW entirely for small, fixed-size structs (a handful of `Double`/`Int`/`enum` fields) — the compiler-generated memberwise copy is already as cheap as or cheaper than reference-counted indirection. Reach for COW only when the backing storage is large (big arrays, buffers, trees) and profiling shows copying is a real cost; see `perf-value-type-copy-cost`.

## See Also

- [`mem-struct-value-semantics`](mem-struct-value-semantics.md) - the value-semantics contract COW preserves
- [`perf-value-type-copy-cost`](perf-value-type-copy-cost.md) - deciding when copy cost actually matters
- [`mem-noncopyable-resource`](mem-noncopyable-resource.md) - the alternative when copies shouldn't be allowed at all
