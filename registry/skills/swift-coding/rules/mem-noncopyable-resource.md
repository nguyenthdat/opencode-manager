# mem-noncopyable-resource

> Use `~Copyable` types to enforce single ownership of resources

## Why It Matters

Ordinary Swift structs are implicitly copyable, so nothing stops two copies of a "handle" from both believing they own the same underlying resource (a file descriptor, a lock, a hardware token) and both trying to close or release it. A `~Copyable` (noncopyable) type makes the compiler enforce single ownership: the value can be moved but never implicitly duplicated, so double-close and use-after-release bugs become compile-time errors instead of runtime corruption.

## Bad

```swift
struct FileHandle {
    private let descriptor: Int32

    init(path: String) {
        descriptor = open(path, O_RDONLY)
    }

    func close() {
        Darwin.close(descriptor)
    }
}

func process(_ handle: FileHandle) {
    handle.close()
}

let handle = FileHandle(path: "/tmp/data")
process(handle)     // closes the descriptor
handle.close()       // copy still exists — double close, undefined behavior
```

## Good

```swift
struct FileHandle: ~Copyable {
    private let descriptor: Int32

    init(path: String) {
        descriptor = open(path, O_RDONLY)
    }

    consuming func close() {
        Darwin.close(descriptor)
    }

    deinit {
        Darwin.close(descriptor)   // guaranteed single release if close() was never called
    }
}

func process(_ handle: consuming FileHandle) {
    handle.close()
}

let handle = FileHandle(path: "/tmp/data")
process(handle)
// handle.close()   // compile error: `handle` was consumed by `process`
```

## Moving Instead of Copying

Noncopyable types can still be passed around explicitly with `consuming`/`borrowing` parameter modifiers, which document whether a function takes ownership or just inspects the value:

```swift
struct Token: ~Copyable {
    let value: String
}

func inspect(_ token: borrowing Token) {
    print(token.value)   // read-only access; caller keeps ownership
}

func redeem(_ token: consuming Token) {
    print("redeeming \(token.value)")   // caller's token is consumed here
}
```

Reach for `~Copyable` when a value represents a resource or capability that must have exactly one owner at a time; keep ordinary data models copyable, since noncopyable generics and collections are still a relatively new, more restrictive corner of the language.

## See Also

- [`mem-struct-value-semantics`](mem-struct-value-semantics.md) - the default copyable-value baseline this rule deviates from
- [`mem-cow-custom-collection`](mem-cow-custom-collection.md) - copy-on-write as the alternative when copies are still needed
- [`mem-deinit-verify`](mem-deinit-verify.md) - confirming resource cleanup actually runs
