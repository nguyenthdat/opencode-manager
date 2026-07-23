# raii-exception-safety-dtor

> Destructors must not throw; mark `noexcept`

## Why It Matters

Destructors are implicitly `noexcept` since C++11. If a destructor throws while another exception is already propagating (e.g. during stack unwinding), `std::terminate` is called immediately — the program aborts with no chance to recover. RAII depends on destructors always running to completion; a throwing destructor breaks that guarantee.

## Bad

```cpp
class Logger {
public:
    ~Logger() {
        flush();          // If flush() throws (e.g. disk full), terminate() is called
        close_handle();   // Never reached if flush() throws
    }
private:
    void flush();       // May throw std::ios_base::failure
    void close_handle();
};
```

## Good

```cpp
class Logger {
public:
    ~Logger() noexcept {
        try {
            flush();
        } catch (const std::exception& e) {
            // Log to stderr as a last resort; never let the exception escape.
            std::fprintf(stderr, "Logger flush failed: %s\n", e.what());
        }
        close_handle();   // Always runs regardless of flush() outcome
    }
};
```

## Provide a Non-Throwing Explicit Alternative

```cpp
class Transaction {
public:
    ~Transaction() noexcept {
        if (!committed_) {
            rollback_noexcept();  // Swallow errors; this is best-effort cleanup
        }
    }

    // Give callers who need to observe commit failure an explicit,
    // non-destructor path that CAN throw.
    void commit() {
        db_.commit();   // May throw; caller can catch and react
        committed_ = true;
    }
private:
    void rollback_noexcept() noexcept { try { db_.rollback(); } catch (...) {} }
    Db& db_;
    bool committed_ = false;
};
```

## See Also

- [err-noexcept-correctness](err-noexcept-correctness.md) - `noexcept` on move operations too
- [raii-raii-for-transactions](raii-raii-for-transactions.md) - Commit/rollback pattern shown above
- [err-strong-exception-guarantee](err-strong-exception-guarantee.md) - Exception guarantees more broadly
