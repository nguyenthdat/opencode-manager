# own-raw-pointer-non-owning

> Raw pointer/reference means non-owning

## Why It Matters

In modern C++, a raw pointer or reference used as a function parameter or return type should always mean "I'm borrowing this, I don't manage its lifetime." Ownership is expressed exclusively via `unique_ptr`/`shared_ptr`/by-value. This convention lets every reader instantly know from a signature whether a function takes ownership, without inspecting the implementation.

## Bad

```cpp
// Ambiguous: does process() take ownership of w, or just use it?
void process(Widget* w) {
    w->update();
    delete w;   // Surprise! This function DOES delete it — violates convention
}

Widget* w = new Widget();
process(w);   // Caller has no way to know w was just deleted
w->update();  // Use-after-free
```

## Good

```cpp
// Raw pointer/reference = non-owning view. process() never deletes w.
void process(Widget* w) {
    if (w) w->update();
}

void process(Widget& w) {
    w.update();   // Reference: caller guarantees non-null, non-owning access
}

// Ownership is explicit when transfer is intended:
void take_ownership(std::unique_ptr<Widget> w) {
    // This signature makes the ownership transfer unambiguous
    store(std::move(w));
}
```

## Decision Guide

| Parameter type | Meaning |
|---|---|
| `Widget&` | Non-owning, non-null, may be mutated |
| `const Widget&` | Non-owning, non-null, read-only |
| `Widget*` | Non-owning, may be null, may be mutated |
| `const Widget*` | Non-owning, may be null, read-only |
| `std::unique_ptr<Widget>` | Owning, sole ownership, transferred by value |
| `std::shared_ptr<Widget>` | Owning, shared ownership |

## See Also

- [own-observer-ptr-reference](own-observer-ptr-reference.md) - Preferring reference when null isn't valid
- [own-span-view](own-span-view.md) - Non-owning views over ranges, not just single objects
- [own-avoid-get-raw-escape](own-avoid-get-raw-escape.md) - Keeping `.get()` pointers within the owner's lifetime
