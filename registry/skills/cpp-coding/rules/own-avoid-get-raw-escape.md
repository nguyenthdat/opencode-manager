# own-avoid-get-raw-escape

> Don't let `.get()` pointers outlive their owner

## Why It Matters

`unique_ptr::get()`/`shared_ptr::get()` return a raw, non-owning pointer to the managed object. Storing that raw pointer somewhere that can outlive the smart pointer (a global, a longer-lived object, another thread) creates a dangling pointer once the owner is destroyed — the raw pointer gives no indication that this has happened.

## Bad

```cpp
class Cache {
public:
    void register_widget(std::unique_ptr<Widget> w) {
        raw_ = w.get();          // Stash the raw pointer...
        pending_.push_back(std::move(w));  // ...but ownership moves elsewhere
    }
    Widget* raw_ = nullptr;
};

void demo() {
    Cache cache;
    {
        auto w = std::make_unique<Widget>();
        cache.register_widget(std::move(w));
    }
    cache.raw_->update();   // Fine here, Cache::pending_ still owns it...
    cache.pending_.clear(); // ...until this line frees it
    cache.raw_->update();   // Dangling pointer, use-after-free
}
```

## Good

```cpp
class Cache {
public:
    void register_widget(std::unique_ptr<Widget> w) {
        pending_.push_back(std::move(w));
    }

    // Provide bounded, scoped access instead of exposing a raw pointer
    // that can be stashed beyond the owner's lifetime.
    Widget* current() const {
        return pending_.empty() ? nullptr : pending_.back().get();
    }

private:
    std::vector<std::unique_ptr<Widget>> pending_;
};

void demo() {
    Cache cache;
    auto w = std::make_unique<Widget>();
    cache.register_widget(std::move(w));

    if (Widget* current = cache.current()) {
        current->update();   // Used immediately; not stored beyond this scope
    }
}
```

## Rule of Thumb

Treat the result of `.get()` as valid only for the duration of the current scope, and never store it in a structure whose lifetime you haven't verified is bounded by the smart pointer's.

## See Also

- [own-raw-pointer-non-owning](own-raw-pointer-non-owning.md) - Raw pointer/reference conventions
- [mem-no-dangling-reference](mem-no-dangling-reference.md) - Dangling references/pointers in general
- [mem-lifetime-of-callback-captures](mem-lifetime-of-callback-captures.md) - The same hazard in lambda captures
