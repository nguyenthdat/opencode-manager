# raii-scope-exit

> Use RAII scope guards instead of goto-cleanup

## Why It Matters

C-style code often uses `goto cleanup;` to centralize teardown logic. In C++, a scope-guard object runs its cleanup lambda automatically at scope exit, on every path (normal return, early return, exception), without the goto pattern's fragility of matching every path to the right label.

## Bad

```cpp
bool process(Resource* r) {
    bool ok = false;
    acquire_lock(r);

    if (!validate(r)) {
        goto cleanup;
    }
    if (!transform(r)) {
        goto cleanup;
    }
    ok = true;

cleanup:
    release_lock(r);   // Easy to forget a path that skips this label
    return ok;
}
```

## Good

```cpp
template <typename F>
class ScopeGuard {
public:
    explicit ScopeGuard(F f) : f_(std::move(f)) {}
    ~ScopeGuard() { if (active_) f_(); }
    void dismiss() noexcept { active_ = false; }
    ScopeGuard(const ScopeGuard&) = delete;
    ScopeGuard& operator=(const ScopeGuard&) = delete;
private:
    F f_;
    bool active_ = true;
};

template <typename F>
ScopeGuard(F) -> ScopeGuard<F>;

bool process(Resource* r) {
    acquire_lock(r);
    ScopeGuard guard([r] { release_lock(r); });

    if (!validate(r)) return false;   // guard still releases the lock
    if (!transform(r)) return false;
    return true;
}   // guard releases the lock here on the success path too
```

## Using a Library Implementation

```cpp
// Prefer a well-tested implementation over hand-rolling one repeatedly:
// - Abseil: absl::Cleanup
// - GSL: gsl::finally
#include "absl/cleanup/cleanup.h"

void demo(Resource* r) {
    acquire_lock(r);
    absl::Cleanup release = [r] { release_lock(r); };
    // ... early returns and throws are all safe ...
}
```

## See Also

- [raii-scope-bound-resources](raii-scope-bound-resources.md) - The general RAII principle
- [raii-raii-for-transactions](raii-raii-for-transactions.md) - RAII for commit/rollback semantics
- [err-raii-exception-safety](err-raii-exception-safety.md) - RAII as the mechanism for exception safety
