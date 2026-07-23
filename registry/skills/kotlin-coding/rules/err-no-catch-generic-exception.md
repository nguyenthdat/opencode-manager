# err-no-catch-generic-exception

> Don't catch generic `Exception` or `Throwable`

## Why It Matters

Catching `Exception` (or worse, `Throwable`, which also covers `Error` subtypes like `OutOfMemoryError` and `StackOverflowError`) swallows every failure indiscriminately, including bugs you never intended to handle — a `NullPointerException` from a real defect looks identical to an expected `IOException` and gets the same silent treatment. This turns programming errors into silently-ignored no-ops instead of surfacing them where they can be fixed.

## Bad

```kotlin
fun loadUserPreferences(path: String): Preferences {
    return try {
        Json.decodeFromString(File(path).readText())
    } catch (e: Exception) {
        Preferences.default()  // Masks IOException, JSON errors, AND real bugs identically
    }
}

fun processAll(items: List<Item>) {
    for (item in items) {
        try {
            process(item)
        } catch (t: Throwable) {  // Even catches OutOfMemoryError, StackOverflowError
            println("skipped")
        }
    }
}
```

## Good

```kotlin
fun loadUserPreferences(path: String): Preferences {
    return try {
        Json.decodeFromString(File(path).readText())
    } catch (e: IOException) {
        logger.warn("Could not read preferences file", e)
        Preferences.default()
    } catch (e: SerializationException) {
        logger.warn("Corrupted preferences file", e)
        Preferences.default()
    }
    // Anything else (e.g. a real NPE bug) propagates and gets noticed
}

fun processAll(items: List<Item>) {
    for (item in items) {
        try {
            process(item)
        } catch (e: ItemProcessingException) {
            logger.warn("Skipping item ${item.id}", e)
        }
    }
}
```

## When Broad Catching Is Legitimate

A top-level boundary (an HTTP request handler, an app's main loop, a coroutine's `CoroutineExceptionHandler`) may need to catch broadly so one failure doesn't take down the whole process — but even there, log with full detail and re-throw/rethrow fatal `Error`s rather than swallowing everything uniformly.

```kotlin
fun handleRequest(request: Request): Response {
    return try {
        router.dispatch(request)
    } catch (e: Exception) {
        logger.error("Unhandled request failure", e)
        Response.internalServerError()
    }
    // Deliberately not catching Throwable: let Errors crash loudly, they're not recoverable
}
```

## Detekt/ktlint Rule

Detekt's `TooGenericExceptionCaught` flags `catch (e: Exception)` and `catch (e: Throwable)` blocks by default:

```yaml
exceptions:
  TooGenericExceptionCaught:
    active: true
    exceptionNames:
      - ArrayIndexOutOfBoundsException
      - Error
      - Exception
      - IllegalMonitorStateException
      - NullPointerException
      - IndexOutOfBoundsException
      - RuntimeException
      - Throwable
```

## See Also

- [`err-custom-exception-hierarchy`](err-custom-exception-hierarchy.md) - specific types to catch instead
- [`err-nothing-to-propagate`](err-nothing-to-propagate.md) - let unhandled exceptions surface rather than swallowing
- [`err-runcatching-pitfalls`](err-runcatching-pitfalls.md) - `runCatching` has this same over-broad-catch problem
- [`async-coroutineexceptionhandler`](async-coroutineexceptionhandler.md) - the coroutine-specific top-level boundary
