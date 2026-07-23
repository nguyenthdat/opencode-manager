# api-nodiscard-return

> Annotate `[[nodiscard]]` on must-check returns

## Why It Matters

Some return values are pure information that would be a bug to discard: a computed result with no side effect, a status the caller must branch on, or a resource the caller must hold onto (like a lock or handle). `[[nodiscard]]` turns "forgot to use the return value" from a silent bug into a compiler warning/error.

## Bad

```cpp
class SpinLock {
public:
    bool try_lock();   // No indication that ignoring this is dangerous
};

SpinLock lock;
lock.try_lock();   // Silently discarded — caller thinks they hold the lock, but don't
critical_section();
```

## Good

```cpp
class SpinLock {
public:
    [[nodiscard]] bool try_lock();
};

SpinLock lock;
lock.try_lock();   // Compiler warning: nodiscard return value ignored
if (!lock.try_lock()) {
    return;   // Correctly handled now
}
critical_section();
```

## Where `[[nodiscard]]` Belongs

```cpp
[[nodiscard]] bool empty() const;             // Pure query: ignoring it is always a bug
[[nodiscard]] std::expected<int, Error> parse(std::string_view s);  // Fallible result
[[nodiscard]] std::unique_ptr<Widget> create(); // Factory: discarding leaks nothing here,
                                                  // but almost certainly indicates a bug

// Not everything needs it — e.g. a logging function's return value (if any)
// is rarely meaningful to check, and marking every function nodiscard
// creates noise that trains developers to ignore the warning.
```

## Class-Wide Annotation

```cpp
class [[nodiscard]] ScopedTimer {   // Warns if a ScopedTimer temporary is discarded,
public:                              // since its entire purpose is RAII-based timing
    ScopedTimer();
    ~ScopedTimer();
};
```

## See Also

- [err-nodiscard-fallible](err-nodiscard-fallible.md) - `[[nodiscard]]` specifically for error-returning functions
- [raii-scope-exit](raii-scope-exit.md) - RAII types that must not be discarded as temporaries
- [api-deprecated-attribute](api-deprecated-attribute.md) - Another attribute-driven API-evolution tool
