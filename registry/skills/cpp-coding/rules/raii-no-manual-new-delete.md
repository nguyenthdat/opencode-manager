# raii-no-manual-new-delete

> Never pair manual `new`/`delete`; wrap in an owner

## Why It Matters

Every manual `new` requires a matching `delete` on every exit path, including exceptions. As soon as a function has more than one return point, or calls something that might throw between `new` and `delete`, manual pairing becomes a leak (or double-free) waiting to happen. Wrapping the allocation in `unique_ptr`/`make_unique` at the point of allocation removes the problem entirely.

## Bad

```cpp
Widget* make_widget(bool configure) {
    Widget* w = new Widget();
    if (configure) {
        configure_widget(w);   // Throws? w leaks.
    }
    return w;                  // Caller must remember to delete — easy to forget
}

void use_it() {
    Widget* w = make_widget(true);
    do_something(w);
    delete w;                  // Must be reached on every path, including throws
}
```

## Good

```cpp
std::unique_ptr<Widget> make_widget(bool configure) {
    auto w = std::make_unique<Widget>();
    if (configure) {
        configure_widget(w.get());   // If this throws, w's destructor runs
    }
    return w;                        // Ownership moves to the caller
}

void use_it() {
    auto w = make_widget(true);
    do_something(w.get());
}   // Destroyed automatically, no delete needed
```

## If a Raw `new` Is Truly Unavoidable

```cpp
// Immediately wrap it — never let a bare owning pointer live unattended
auto owner = std::unique_ptr<Widget>(new Widget(non_movable_arg));
// (make_unique can't be used here only if Widget's constructor is inaccessible
//  to std::make_unique, e.g. a private constructor with a friend factory)
```

## See Also

- [anti-raw-new-delete](anti-raw-new-delete.md) - Anti-pattern reference for this rule
- [own-make-unique-shared](own-make-unique-shared.md) - Prefer `make_unique`/`make_shared` over `new`
- [raii-unique-ptr-default](raii-unique-ptr-default.md) - `unique_ptr` as the default owner
