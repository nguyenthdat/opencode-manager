# anti-bare-catch

> Don't catch `Exception` without specific handling

## Why It Matters

Catching `Exception` swallows programming errors (`NullPointerException`, `ClassCastException`) that should never be caught, masking real bugs. It also catches intentional exceptions (`InterruptedException`, `ThreadDeath`) that have special semantics, breaking thread interruption mechanisms.

## Bad

```groovy
try {
    def data = fetchFromApi()
    processData(data)
} catch (Exception e) {
    // Swallows NPE, ClassCastException, etc.
    log.warn("Something failed: ${e.message}")
    return []
}

try {
    Thread.sleep(1000)
    doWork()
} catch (Exception e) {
    // InterruptedException should set the interrupt flag!
    return
}
```

## Good

```groovy
try {
    def data = fetchFromApi()
    processData(data)
} catch (IOException e) {
    log.warn("Network error: ${e.message}")
    return []
} catch (JsonParseException e) {
    log.warn("Invalid response format: ${e.message}")
    return []
}

try {
    Thread.sleep(1000)
    doWork()
} catch (InterruptedException e) {
    Thread.currentThread().interrupt()   // Restore interrupt flag
    return
}
```

## See Also

- [err-catch-specific](err-catch-specific.md) - Catch specific exceptions
- [err-no-bare-throw](err-no-bare-throw.md) - Always throw with context
- [err-custom-exception](err-custom-exception.md) - Create domain-specific exceptions
