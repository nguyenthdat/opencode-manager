# own-const-correctness-ownership

> Distinguish ownership from access via `const`

## Why It Matters

`const` on a smart pointer and `const` on the pointee are two different things: `const std::unique_ptr<Widget>` means the pointer itself can't be reassigned/moved, but the pointee can still be mutated through it. `std::unique_ptr<const Widget>` means the reverse. Understanding and choosing the right one prevents accidental mutation and communicates intent precisely.

## Bad

```cpp
class Renderer {
public:
    // Ambiguous intent: can callers of get_config() mutate the returned Config?
    Config* get_config() { return config_.get(); }
private:
    std::unique_ptr<Config> config_;
};

void demo(Renderer& r) {
    r.get_config()->set_resolution(4000, 3000);  // Mutating through a "getter" — surprising
}
```

## Good

```cpp
class Renderer {
public:
    // Read-only access from const context
    const Config& get_config() const { return *config_; }

    // Explicit mutable access, only from a non-const context
    Config& get_mutable_config() { return *config_; }

private:
    std::unique_ptr<Config> config_;   // The pointer itself is reassignable by Renderer
};
```

## `const` Propagation Through Pointers

```cpp
void inspect(const std::unique_ptr<Widget>& w) {
    w->update();     // COMPILES: const applies to the pointer, not through it by default
    // w = nullptr;  // Doesn't compile: can't reassign a const unique_ptr
}

void inspect_deep(const Widget* w) {
    // w->set_value(1);  // Doesn't compile: pointee is const
}

// Prefer std::experimental::propagate_const or simply pass by
// `const Widget&`/`const Widget*` at API boundaries to get real deep constness
// without needing a smart-pointer wrapper at all.
void inspect_best(const Widget& w) {
    w.read_only_method();
}
```

## See Also

- [api-const-correctness](api-const-correctness.md) - Broader `const`-correctness guidance
- [own-raw-pointer-non-owning](own-raw-pointer-non-owning.md) - Non-owning access patterns
- [type-strong-typedef-ids](type-strong-typedef-ids.md) - Encoding invariants in the type system generally
