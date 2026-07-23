# perf-pass-by-const-ref-large

> Pass large objects by `const&`

## Why It Matters

Passing a large object (a `std::vector`, `std::string`, or any type with meaningful heap-allocated or otherwise expensive-to-copy state) by value creates a full copy at the call site for read-only use, which is pure overhead when the function never needs to own or mutate its own copy. `const&` avoids the copy entirely while still preventing mutation of the caller's object.

## Bad

```cpp
double sum(std::vector<double> values) {   // Copies the entire vector on every call
    double total = 0;
    for (double v : values) total += v;
    return total;
}

sum(large_vector);   // Full copy of potentially millions of elements, just to read them
```

## Good

```cpp
double sum(const std::vector<double>& values) {   // No copy: borrows the caller's vector
    double total = 0;
    for (double v : values) total += v;
    return total;
}

sum(large_vector);   // No copy at all
```

## For Small, Trivially-Copyable Types, Pass by Value Instead

```cpp
// Small types (int, double, a small struct of a few primitives) are cheaper
// to copy directly than to pass by reference (which involves a pointer
// indirection): pass these by value, not const&.
void set_position(double x, double y);       // Not: (const double& x, const double& y)
void apply_color(Color c);                     // If Color is a small POD struct
```

## Views for Read-Only String/Range Parameters

```cpp
// Prefer std::string_view / std::span over const std::string& / const
// std::vector<T>& when the caller might have the data in a different
// container entirely (see own-span-view for the full rationale).
void process(std::string_view text);
void process(std::span<const double> values);
```

## See Also

- [own-span-view](own-span-view.md) - Non-owning views as an even more flexible alternative
- [api-pass-by-value-sink-ref-view](api-pass-by-value-sink-ref-view.md) - The full parameter-passing decision table
- [perf-move-semantics](perf-move-semantics.md) - When by-value + move is actually the right choice
