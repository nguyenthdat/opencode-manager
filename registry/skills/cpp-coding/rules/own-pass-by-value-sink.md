# own-pass-by-value-sink

> Take ownership by value (`unique_ptr`) when sinking

## Why It Matters

When a function is going to store or transfer ownership of a `unique_ptr`, taking it by value (not `unique_ptr&` or `const unique_ptr&`) makes the ownership transfer explicit at every call site: the caller must `std::move` it in, visibly giving it up. This also lets the compiler elide the move in common cases.

## Bad

```cpp
// Reference parameter obscures whether ownership transfers
void store(std::unique_ptr<Widget>& w) {
    widgets_.push_back(std::move(w));   // Caller's variable is now null,
                                          // but nothing in the call site shows that
}

auto w = std::make_unique<Widget>();
store(w);       // Looks like a normal pass-by-reference call
use(w);         // w is now null — surprising bug
```

## Good

```cpp
// By-value sink parameter: the caller must explicitly std::move
void store(std::unique_ptr<Widget> w) {
    widgets_.push_back(std::move(w));
}

auto w = std::make_unique<Widget>();
store(std::move(w));   // Explicit at the call site: ownership is given up
// use(w) here would be a compile error after move-from in many
// static-analysis configurations, and is clearly a bug on inspection.
```

## Conditional Ownership Transfer

```cpp
// If the function might NOT take ownership, prefer a non-owning parameter
// plus a separate, explicit transfer path, rather than an in/out unique_ptr&.
bool try_register(Widget& w);          // Non-owning: just inspects/uses w
void register_and_own(std::unique_ptr<Widget> w);  // Always takes ownership
```

## See Also

- [own-unique-ptr-sole](own-unique-ptr-sole.md) - Ownership semantics of `unique_ptr`
- [own-move-transfer](own-move-transfer.md) - Explicit `std::move` at transfer points
- [api-pass-by-value-sink-ref-view](api-pass-by-value-sink-ref-view.md) - General parameter-passing decision table
