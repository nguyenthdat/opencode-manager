# err-finally-cleanup

> Use `try`/`finally` or `Closeable.use { }` for deterministic cleanup

## Why It Matters

Resources like file handles, database connections, and sockets must be released even when the code using them throws — cleanup logic placed after the risky code, instead of in `finally` or `use { }`, simply never runs on the exception path, leaking the resource until the GC or OS eventually reclaims it. `use { }` is Kotlin's idiomatic, exception-safe equivalent of Java's try-with-resources, built on `Closeable`/`AutoCloseable`.

## Bad

```kotlin
fun readFirstLine(path: String): String {
    val reader = File(path).bufferedReader()
    val line = reader.readLine()  // If this throws, reader.close() never runs
    reader.close()
    return line ?: ""
}

fun withLock(lock: Lock, block: () -> Unit) {
    lock.lock()
    block()          // If this throws, the lock is never released - deadlocks other callers
    lock.unlock()
}
```

## Good

```kotlin
fun readFirstLine(path: String): String {
    File(path).bufferedReader().use { reader ->
        return reader.readLine() ?: ""
    }
    // reader.close() is guaranteed to run, even if readLine() throws
}

fun withLock(lock: Lock, block: () -> Unit) {
    lock.lock()
    try {
        block()
    } finally {
        lock.unlock()  // Always runs, whether block() throws or returns normally
    }
}
```

## Chaining Multiple Resources

```kotlin
fun copyFile(source: String, dest: String) {
    File(source).inputStream().use { input ->
        File(dest).outputStream().use { output ->
            input.copyTo(output)
        }
    }
    // Both streams close in reverse order, even if copyTo() throws
}
```

## See Also

- [`err-exceptions-for-exceptional`](err-exceptions-for-exceptional.md) - broader context on exception-safe design
- [`async-cancellation-cooperation`](async-cancellation-cooperation.md) - `finally` also runs on coroutine cancellation
- [`err-no-catch-generic-exception`](err-no-catch-generic-exception.md) - don't combine broad catches with cleanup logic
