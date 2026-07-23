# perf-avoid-shared-ptr-atomic-overhead

> Avoid `shared_ptr` atomics in hot paths

## Why It Matters

Every `shared_ptr` copy and destruction performs an atomic increment/decrement on the control block's reference count (so it remains correct under concurrent access from multiple threads) — even in single-threaded code, or code where the `shared_ptr` is never actually shared across threads. In a hot loop, this atomic overhead can be measurable versus a non-atomic reference count or, better, avoiding the indirection entirely.

## Bad

```cpp
void render_all(const std::vector<std::shared_ptr<Renderable>>& items) {
    for (const auto& item : items) {
        std::shared_ptr<Renderable> local = item;   // Atomic increment per iteration
        local->draw();
    }   // Atomic decrement per iteration too
}
```

## Good — Pass by Reference, No Refcount Churn

```cpp
void render_all(const std::vector<std::shared_ptr<Renderable>>& items) {
    for (const auto& item : items) {
        item->draw();   // No copy of the shared_ptr at all — just dereference it
    }
}

// Or better still, if this function never needs ownership semantics:
void render_all(std::span<Renderable* const> items) {
    for (Renderable* item : items) {
        item->draw();   // No shared_ptr overhead anywhere in the hot path
    }
}
```

## Consider `unique_ptr` or Plain Values If Sharing Isn't Actually Needed

```cpp
// If profiling shows shared_ptr refcounting is the bottleneck and the
// "shared" ownership was never actually required, switch to unique_ptr or
// plain value storage (see own-shared-ptr-not-default).
std::vector<std::unique_ptr<Renderable>> items;
```

## See Also

- [own-shared-ptr-not-default](own-shared-ptr-not-default.md) - Avoiding unnecessary `shared_ptr` in the first place
- [own-raw-pointer-non-owning](own-raw-pointer-non-owning.md) - Non-owning access in hot loops
- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Confirming this is genuinely the bottleneck first
