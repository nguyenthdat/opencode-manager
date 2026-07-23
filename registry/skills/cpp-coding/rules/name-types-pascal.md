# name-types-pascal

> `PascalCase` for types, classes, enums, concepts

## Why It Matters

A consistent casing convention that distinguishes types from functions/variables at a glance (without needing to look up a declaration) speeds up reading and reviewing code. `PascalCase` (also called `UpperCamelCase`) for types is the dominant convention across major C++ style guides (LLVM, Google, Microsoft) and standard-library-adjacent code that introduces its own types.

## Bad

```cpp
class widget_renderer { /* ... */ };       // Looks like a variable/function name
struct http_request { /* ... */ };
enum class connection_state { idle, active, closed };
template <typename t> concept sortable_container = /* ... */;
```

## Good

```cpp
class WidgetRenderer { /* ... */ };
struct HttpRequest { /* ... */ };
enum class ConnectionState { Idle, Active, Closed };
template <typename T> concept SortableContainer = /* ... */;
```

## Consistency With the Standard Library Is a Deliberate Exception

```cpp
// Types that intentionally mimic std:: naming (e.g. a custom allocator or
// iterator meant to be a drop-in STL-compatible type) may use lower_snake_case
// to match STL conventions for that specific interop purpose:
class my_custom_allocator { /* STL-compatible allocator interface */ };
```

## See Also

- [name-functions-lower-snake](name-functions-lower-snake.md) - The complementary function/variable convention
- [name-template-param-single-letter](name-template-param-single-letter.md) - Naming for template type parameters specifically
- [type-strong-typedef-ids](type-strong-typedef-ids.md) - New types that should follow this convention
