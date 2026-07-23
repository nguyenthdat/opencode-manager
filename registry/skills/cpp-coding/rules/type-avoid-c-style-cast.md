# type-avoid-c-style-cast

> Use named casts, never C-style casts

## Why It Matters

A C-style cast `(T)expr` silently picks whichever of `static_cast`, `const_cast`, `reinterpret_cast`, or a combination is needed to make the code compile — including ones that quietly strip `const` or reinterpret unrelated types. Named casts each do exactly one specific, restricted kind of conversion, so grep-ing for `reinterpret_cast` or `const_cast` finds every genuinely risky conversion in the codebase; a C-style cast hides which category it actually performs.

## Bad

```cpp
const int* p = get_value();
int* mutable_p = (int*)p;          // Silently does a const_cast — dangerous and hidden

Base* base = get_base();
Derived* derived = (Derived*)base;  // Silently does a static_cast with NO runtime check —
                                      // if base isn't actually a Derived, this is UB

double d = 3.14;
int i = (int)d;                     // Which conversion is this? Truncating static_cast —
                                      // but the syntax doesn't distinguish it from the two above
```

## Good

```cpp
const int* p = get_value();
// int* mutable_p = const_cast<int*>(p);   // Grep-able, and forces the author to
                                             // justify stripping const explicitly

Base* base = get_base();
Derived* derived = dynamic_cast<Derived*>(base);   // Runtime-checked; nullptr on failure
if (!derived) { handle_not_a_derived(); }

double d = 3.14;
int i = static_cast<int>(d);   // Explicit, restricted to value conversions
```

## Cast Selection Guide

| Cast | Use for |
|---|---|
| `static_cast` | Well-defined value/pointer conversions checked at compile time |
| `dynamic_cast` | Polymorphic downcasts, checked at runtime |
| `const_cast` | Adding/removing `const`/`volatile` (rare, needs justification) |
| `reinterpret_cast` | Low-level bit reinterpretation (rare, needs justification) |

## See Also

- [type-dynamic-cast-polymorphic](type-dynamic-cast-polymorphic.md) - `dynamic_cast` usage in depth
- [type-narrowing-conversion-explicit](type-narrowing-conversion-explicit.md) - Explicit, checked narrowing conversions
- [anti-c-style-cast](anti-c-style-cast.md) - Anti-pattern reference
