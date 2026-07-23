# mem-null-check-before-deref

> Check pointer validity before dereference

## Why It Matters

Dereferencing a null (or otherwise invalid) pointer is undefined behavior — it may crash immediately, silently read garbage, or (in optimized builds) let the compiler assume it never happens and eliminate the surrounding check entirely, hiding the bug further. Whenever a pointer's validity isn't guaranteed by the type system (i.e. it's not a reference), check it before use.

## Bad

```cpp
void render(Widget* widget) {
    widget->draw();   // Crashes (or worse, silently corrupts) if widget is null
}

Widget* find_widget(std::string_view name);

render(find_widget("missing"));   // find_widget may return nullptr
```

## Good

```cpp
void render(Widget* widget) {
    if (!widget) {
        log_warning("render() called with null widget");
        return;
    }
    widget->draw();
}
```

## Prefer Making Null Impossible in the First Place

```cpp
// If null truly should never be valid here, use a reference instead and push
// the null-check to the one place that actually produces the pointer:
void render(Widget& widget) {
    widget.draw();   // No null check needed: type system guarantees validity
}

std::optional<Widget*> find_widget(std::string_view name);

if (auto w = find_widget("name")) {
    render(**w);   // The optional forces the caller to handle "not found"
}
```

## See Also

- [own-observer-ptr-reference](own-observer-ptr-reference.md) - Preferring references to eliminate null entirely
- [type-optional-nullable](type-optional-nullable.md) - `std::optional` for values that may be absent
- [mem-no-dangling-reference](mem-no-dangling-reference.md) - Dangling (not just null) pointer hazards
