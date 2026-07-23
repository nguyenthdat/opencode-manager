# own-make-unique-shared

> Use `make_unique`/`make_shared` over raw `new`

## Why It Matters

`make_unique`/`make_shared` avoid naked `new` at call sites, are exception-safe in argument evaluation order (no chance of a leaked raw pointer if a sibling argument throws), and `make_shared` additionally combines the control block and object into a single heap allocation, reducing allocation count and improving cache locality.

## Bad

```cpp
void configure(std::shared_ptr<Logger> logger, std::shared_ptr<Config> config);

// Pre-C++17, argument evaluation order was unspecified: if `new Config(...)`
// throws after `new Logger(...)` succeeds but before it's wrapped, Logger leaks.
configure(std::shared_ptr<Logger>(new Logger()),
          std::shared_ptr<Config>(new Config()));

// Two heap allocations: one for Widget, one for the shared_ptr control block
auto w = std::shared_ptr<Widget>(new Widget());
```

## Good

```cpp
configure(std::make_shared<Logger>(), std::make_shared<Config>());

// Single allocation for object + control block
auto w = std::make_shared<Widget>();

auto u = std::make_unique<Widget>(arg1, arg2);
```

## When `make_shared` Isn't Appropriate

```cpp
// Custom deleter required: make_shared doesn't support one
std::shared_ptr<FILE> f(std::fopen("x", "r"), [](FILE* fp) { if (fp) std::fclose(fp); });

// Weak references keep the combined allocation alive: with make_shared, the
// object memory isn't freed until the last weak_ptr also expires (since object
// and control block share one allocation). For very large objects with
// long-lived weak_ptrs, a separate allocation via new + shared_ptr(...) may be
// preferable to release the object memory sooner.
```

## See Also

- [own-unique-ptr-sole](own-unique-ptr-sole.md) - `unique_ptr` ownership semantics
- [raii-no-manual-new-delete](raii-no-manual-new-delete.md) - Avoiding raw `new` in general
- [anti-raw-new-delete](anti-raw-new-delete.md) - Anti-pattern reference
