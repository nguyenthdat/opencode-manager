# anti-c-style-cast

> Don't use C-style casts

## Why It Matters

`(T)expr` silently performs whichever combination of `static_cast`, `const_cast`, and `reinterpret_cast` is needed to compile — including operations (stripping `const`, reinterpreting unrelated pointer types) that a reviewer scanning for risky casts has no way to spot without checking each one individually.

## Bad

```cpp
double d = 3.14;
int i = (int)d;                 // Which kind of cast is this, exactly?

const int* p = get_value();
int* mp = (int*)p;               // Silently strips const — dangerous and hidden
```

## Good

```cpp
double d = 3.14;
int i = static_cast<int>(d);     // Explicit: a value conversion, nothing more

const int* p = get_value();
// int* mp = const_cast<int*>(p);   // Grep-able; requires explicit justification
```

## See Also

- [type-avoid-c-style-cast](type-avoid-c-style-cast.md) - Full cast-selection guidance
- [type-dynamic-cast-polymorphic](type-dynamic-cast-polymorphic.md) - `dynamic_cast` for polymorphic downcasts
- [type-narrowing-conversion-explicit](type-narrowing-conversion-explicit.md) - Explicit, checked narrowing conversions
