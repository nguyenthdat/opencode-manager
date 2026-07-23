# api-return-value-not-out-param

> Return values instead of out-parameters

## Why It Matters

Guaranteed copy elision (C++17) and move semantics make returning by value essentially free for most types, so the historical performance reason for output parameters (`void compute(Result& out)`) no longer applies in most cases. Returning a value produces a clearer signature (the function's purpose is visible from its return type), composes naturally with chaining and `auto`, and eliminates the risk of an uninitialized or stale out-parameter.

## Bad

```cpp
void compute_bounds(const std::vector<Point>& points, Point& out_min, Point& out_max) {
    // Caller must pre-declare out_min/out_max, and nothing enforces they're
    // actually written to on every path.
    out_min = points[0];
    out_max = points[0];
    for (const auto& p : points) {
        out_min = min(out_min, p);
        out_max = max(out_max, p);
    }
}

Point min_pt, max_pt;
compute_bounds(points, min_pt, max_pt);
```

## Good

```cpp
struct Bounds { Point min; Point max; };

Bounds compute_bounds(const std::vector<Point>& points) {
    Bounds b{points[0], points[0]};
    for (const auto& p : points) {
        b.min = min(b.min, p);
        b.max = max(b.max, p);
    }
    return b;   // Guaranteed copy elision (C++17): no copy, no move even, in this case
}

auto [min_pt, max_pt] = compute_bounds(points);   // Structured bindings unpack it cleanly
```

## When an Output Parameter Is Still Justified

```cpp
// Genuinely multiple, independent, large outputs that the caller wants to
// reuse across calls (avoiding repeated allocation) — an explicit,
// documented performance trade-off, not a default.
void render_frame(FrameBuffer& reused_buffer);  // Caller controls buffer lifetime/reuse
```

## See Also

- [perf-return-value-optimization](perf-return-value-optimization.md) - RVO/NRVO mechanics in depth
- [anti-output-parameters](anti-output-parameters.md) - Anti-pattern reference
- [type-structured-bindings](type-structured-bindings.md) - Consuming multi-value returns ergonomically
