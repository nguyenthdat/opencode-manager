# anti-catch-all-swallow

> Don't write empty `catch(...)` blocks

## Why It Matters

An empty `catch (...) {}` discards every possible error — including bugs and corrupted state — with no log entry, no diagnostic, and no way to ever discover it happened. If an error genuinely can be ignored, that decision should be explicit and visible, not silent.

## Bad

```cpp
void save() {
    try {
        write_to_disk(data_);
    } catch (...) {
        // Silently discarded — no log, no user notification, no trace at all
    }
}
```

## Good

```cpp
void save() {
    try {
        write_to_disk(data_);
    } catch (const std::exception& e) {
        log_error("save failed: {}", e.what());
        notify_user("Could not save. Changes may be lost.");
    }
}
```

## See Also

- [err-no-catch-all-swallow](err-no-catch-all-swallow.md) - Full rationale and the one legitimate exception
- [err-catch-by-const-ref](err-catch-by-const-ref.md) - Correct catch-clause form
- [raii-exception-safety-dtor](raii-exception-safety-dtor.md) - The narrow, destructor-only case where swallowing is acceptable
