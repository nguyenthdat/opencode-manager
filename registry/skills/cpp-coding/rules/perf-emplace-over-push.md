# perf-emplace-over-push

> Use `emplace_back` over `push_back(T(...))`

## Why It Matters

`push_back(T(args...))` constructs a temporary `T`, then move-constructs (or copies) it into the container — two constructions for one logical object. `emplace_back(args...)` forwards the arguments directly to `T`'s constructor inside the container's storage, constructing the object exactly once.

## Bad

```cpp
std::vector<Widget> widgets;
widgets.push_back(Widget("button", 100, 50));   // Constructs a temporary Widget,
                                                    // then move-constructs it again
                                                    // into the vector's storage
```

## Good

```cpp
std::vector<Widget> widgets;
widgets.emplace_back("button", 100, 50);   // Constructs the Widget directly in place —
                                              // exactly one construction, no temporary
```

## Applies to Other Containers Too

```cpp
std::map<std::string, Widget> widget_map;
widget_map.emplace("main_button", "button", 100, 50);   // Constructs the Widget in place

std::unique_ptr<Widget> ptr = std::make_unique<Widget>("button", 100, 50);  // Same principle
```

## When `push_back` Is Just as Good

```cpp
// If you already have an existing object (not constructing a new one),
// push_back(std::move(existing)) is equally efficient and often clearer:
Widget w = create_configured_widget();
widgets.push_back(std::move(w));   // No advantage to emplace_back here
```

## See Also

- [perf-reserve-known-size](perf-reserve-known-size.md) - Reducing reallocation alongside construction cost
- [own-make-unique-shared](own-make-unique-shared.md) - The analogous in-place construction for smart pointers
- [perf-move-semantics](perf-move-semantics.md) - Move semantics more broadly
