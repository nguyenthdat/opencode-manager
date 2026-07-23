# perf-inline-hot-path

> Use `@inline(__always)`/`@inlinable` sparingly for verified hot paths

## Why It Matters

Swift's optimizer already inlines aggressively within a module at `-O`, so manually forcing inlining is rarely needed and can even hurt performance by bloating code size and instruction-cache pressure if misapplied. `@inlinable` (to let cross-module callers inline a function from a library) and `@inline(__always)` (to force inlining even when the heuristic wouldn't) are targeted tools for the rare case where profiling has shown a specific small function—typically a tiny accessor or arithmetic helper called in a tight loop—benefits measurably from it.

## Bad

```swift
// Sprinkling @inline(__always) everywhere "for performance" without
// measurement adds code-size bloat and can slow things down.
@inline(__always)
func processOrder(_ order: Order) -> Receipt {
    // A large function body: forcing inlining here just duplicates a lot
    // of code at every call site for no measured benefit.
    validate(order)
    let total = calculateTotal(order)
    let tax = calculateTax(total)
    return Receipt(order: order, total: total, tax: tax)
}
```

## Good

```swift
// A tiny, extremely hot function verified via Instruments to be a bottleneck
// (e.g. called millions of times per frame in a rendering loop).
@inline(__always)
func clamp(_ value: Double, to range: ClosedRange<Double>) -> Double {
    min(max(value, range.lowerBound), range.upperBound)
}

// Exposing an inlinable function from a Swift package so downstream
// modules can specialize/inline it across the module boundary:
public struct Vector3 {
    public var x, y, z: Double

    @inlinable
    public static func + (lhs: Vector3, rhs: Vector3) -> Vector3 {
        Vector3(x: lhs.x + rhs.x, y: lhs.y + rhs.y, z: lhs.z + rhs.z)
    }
}
```

## Measure First

```swift
// The correct workflow: profile with Instruments' Time Profiler, find the
// hot function, confirm it's small and called extremely frequently, THEN
// consider @inline(__always) or @inlinable — never apply it speculatively.
// See perf-profile-instruments for the measurement step this depends on.
```

## See Also

- [`perf-profile-instruments`](perf-profile-instruments.md) - Measuring before applying this rule
- [`perf-avoid-existential-boxing`](perf-avoid-existential-boxing.md) - Related hot-path dispatch concerns
- [`api-access-control-minimal`](api-access-control-minimal.md) - `@inlinable` requires exposing implementation details
