# err-no-catch-all-swallow

> Don't swallow exceptions with empty `catch(...)`

## Why It Matters

An empty `catch (...) {}` block discards every error unconditionally — including programming bugs, corrupted state, and out-of-memory conditions — leaving no trace for debugging and letting the program continue in a potentially inconsistent state. If an error truly can be ignored, that decision should be explicit and logged, not silent.

## Bad

```cpp
void save_settings() {
    try {
        write_to_disk(settings_);
    } catch (...) {
        // Silently ignored — the user has no idea their settings weren't saved,
        // and there's no log entry to debug this later.
    }
}
```

## Good

```cpp
void save_settings() {
    try {
        write_to_disk(settings_);
    } catch (const std::exception& e) {
        log_error("failed to save settings: {}", e.what());
        notify_user("Could not save settings. Changes may be lost.");
    } catch (...) {
        log_error("failed to save settings: unknown exception");
        notify_user("Could not save settings. Changes may be lost.");
    }
}
```

## Only Swallow When It's a Deliberate, Documented Best-Effort Action

```cpp
~Logger() noexcept {
    try {
        flush();
    } catch (...) {
        // Deliberate: destructors must not throw, and there is genuinely
        // nothing further we can do here. Document why this is safe to ignore.
    }
}
```

## See Also

- [err-catch-by-const-ref](err-catch-by-const-ref.md) - Correct catch-clause form
- [raii-exception-safety-dtor](raii-exception-safety-dtor.md) - The one legitimate destructor exception to this rule
- [anti-catch-all-swallow](anti-catch-all-swallow.md) - Anti-pattern reference
