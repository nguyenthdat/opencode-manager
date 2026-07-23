# err-defer-cleanup

> Use `defer` for guaranteed cleanup

## Why It Matters

`defer` schedules a block to run when the current scope exits — normally, via an early `return`, or by a thrown error — so cleanup code (closing a file, ending a signpost, unlocking a mutex, balancing a counter) is written once, right next to the resource acquisition, and can't be skipped by adding a new early exit later. Without `defer`, every new `return`/`throw` you add to a function is a chance to forget the matching cleanup.

## Bad

```swift
func processFile(at url: URL) throws -> Int {
    let handle = try FileHandle(forReadingFrom: url)
    let data = handle.readDataToEndOfFile()
    guard !data.isEmpty else {
        handle.closeFile()   // Must remember to close here...
        throw FileError.empty
    }
    let count = try parse(data)
    handle.closeFile()       // ...and here. Miss one path and the fd leaks.
    return count
}
```

## Good

```swift
func processFile(at url: URL) throws -> Int {
    let handle = try FileHandle(forReadingFrom: url)
    defer { handle.closeFile() }   // Runs on every exit path, guaranteed

    let data = handle.readDataToEndOfFile()
    guard !data.isEmpty else {
        throw FileError.empty
    }
    return try parse(data)
}
```

## Multiple defers Run in Reverse Order

```swift
func demo() {
    print("start")
    defer { print("first defer") }
    defer { print("second defer") }
    print("end")
}
// Prints: start, end, second defer, first defer
// (LIFO order — mirrors how nested resource acquisition should unwind)

// Common pattern: pair every acquire with an adjacent defer release
func withLock<T>(_ lock: NSLock, _ body: () throws -> T) rethrows -> T {
    lock.lock()
    defer { lock.unlock() }
    return try body()
}
```

`defer` runs even if the scope exits via a thrown error, so it's the right place for cleanup that must happen regardless of success or failure — but it does not run if the process crashes or `exit()` is called directly.

## See Also

- [`err-throws-try-propagate`](err-throws-try-propagate.md) - defer works naturally alongside throwing functions
- [`async-task-cancel-cleanup`](async-task-cancel-cleanup.md) - cleanup on cancellation in async contexts
- [`mem-deinit-verify`](mem-deinit-verify.md) - the object-lifetime equivalent of guaranteed cleanup
