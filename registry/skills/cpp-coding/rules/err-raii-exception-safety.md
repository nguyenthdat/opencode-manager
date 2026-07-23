# err-raii-exception-safety

> Rely on RAII for exception-safe cleanup

## Why It Matters

C++ has no `finally` block. RAII is the language's actual mechanism for guaranteeing cleanup runs regardless of whether a function returns normally or an exception propagates through it: as the stack unwinds, every local object's destructor runs automatically.

## Bad

```cpp
void process() {
    Resource* r = acquire_resource();
    try {
        do_work(r);       // If this throws...
    } catch (...) {
        release_resource(r);
        throw;            // ...manual re-throw after cleanup, easy to get wrong
    }
    release_resource(r);   // Duplicated cleanup logic on the success path
}
```

## Good

```cpp
void process() {
    auto r = acquire_resource_raii();   // RAII wrapper (unique_ptr + custom deleter, etc.)
    do_work(r.get());
}   // Cleanup runs automatically whether do_work() throws or returns normally,
    // and there's exactly one place the cleanup logic lives.
```

## Combining Multiple Resources

```cpp
void process_two() {
    auto a = acquire_a_raii();
    auto b = acquire_b_raii();   // If this throws, `a`'s destructor still runs
    do_work(a.get(), b.get());
}   // `b` destroyed first, then `a` — reverse construction order, automatically
```

## See Also

- [raii-scope-bound-resources](raii-scope-bound-resources.md) - The general RAII principle
- [err-strong-exception-guarantee](err-strong-exception-guarantee.md) - Exception safety guarantee levels
- [raii-exception-safety-dtor](raii-exception-safety-dtor.md) - Destructors themselves must not throw
