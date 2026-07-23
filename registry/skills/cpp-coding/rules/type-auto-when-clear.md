# type-auto-when-clear

> Use `auto` when the type is obvious or noisy

## Why It Matters

`auto` removes redundant, hard-to-type, or purely mechanical type spelling (iterator types, lambda types, long template instantiations) while keeping the actual information — the value's meaning — front and center. Overusing it where the type isn't obvious from the right-hand side, though, can make code harder to review; use `auto` where it improves clarity, not reflexively everywhere.

## Bad — Type Is Noisy and Adds No Information

```cpp
std::unordered_map<std::string, std::vector<std::pair<int, std::string>>>::const_iterator
    it = my_map.find(key);

std::function<void(int, const std::string&)> callback =
    [](int x, const std::string& s) { std::cout << x << s; };
```

## Good

```cpp
auto it = my_map.find(key);   // Type is exactly what find() returns — no information lost

auto callback = [](int x, const std::string& s) { std::cout << x << s; };
```

## When to Spell the Type Out Instead

```cpp
// The type isn't obvious from the right-hand side; spelling it out aids review:
Widget w = factory.create();   // create()'s return type isn't obvious without auto here...

// ...unless the type is clearly named at the call site already:
auto w = create_widget();      // Function name already tells the reader it's a Widget

// Prefer explicit types for public API signatures and when a specific,
// possibly-narrower type is intentional (e.g. forcing a float instead of
// whatever an expression happens to produce):
float ratio = compute_ratio();   // Explicit: intentionally narrows from a wider result
```

## `auto` Preserves `const`/Reference-ness Only If You Ask For It

```cpp
const std::vector<int>& source = get_source();
auto copy = source;         // Copies! auto strips const and & by default
auto& ref = source;         // Explicit &: binds a reference, no copy
const auto& cref = source;  // Explicit const&: read-only reference, no copy
```

## See Also

- [type-structured-bindings](type-structured-bindings.md) - `auto` combined with structured bindings
- [tmpl-auto-template-param](tmpl-auto-template-param.md) - `auto` in generic function parameters
- [perf-pass-by-const-ref-large](perf-pass-by-const-ref-large.md) - Avoiding accidental copies via bare `auto`
