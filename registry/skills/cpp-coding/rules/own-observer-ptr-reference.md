# own-observer-ptr-reference

> Prefer reference over pointer when null is invalid

## Why It Matters

A reference parameter cannot be null (barring deliberate misuse via a dereferenced null pointer), so it communicates "this argument is always valid" directly in the type system — no null check needed inside the function, and no ambiguity for the caller about whether null is acceptable. Reserve pointers for parameters where null is a meaningful, valid state.

## Bad

```cpp
void render(Widget* w) {
    // Every caller AND every line of this function must consider: can w be null?
    if (w == nullptr) return;
    w->draw();
}

render(nullptr);   // Compiles, silently does nothing — is that intended?
```

## Good

```cpp
void render(Widget& w) {
    w.draw();   // No null check needed: a reference always refers to a valid object
}

// render(nullptr);        // Doesn't compile
// render(*maybe_null_ptr); // Caller must explicitly dereference, making the
                            // "I've verified this isn't null" claim visible
```

## When a Pointer Is the Right Choice

```cpp
// Null genuinely means "no widget" — a valid, distinct third state
void set_tooltip_anchor(Widget* anchor) {
    tooltip_anchor_ = anchor;   // nullptr means "no anchor, don't show tooltip"
}

// Optional out-parameter
void find_widget(std::string_view name, Widget** out_widget);   // Prefer std::optional<Widget*> instead where possible
```

## Preferred Alternative for Optional Pointers

```cpp
#include <optional>

std::optional<Widget*> find_widget(std::string_view name);

if (auto found = find_widget("ok")) {
    (*found)->draw();
}
```

## See Also

- [own-raw-pointer-non-owning](own-raw-pointer-non-owning.md) - Pointer/reference decision table
- [mem-null-check-before-deref](mem-null-check-before-deref.md) - Handling the pointer case safely
- [type-optional-nullable](type-optional-nullable.md) - `std::optional` for genuinely absent values
