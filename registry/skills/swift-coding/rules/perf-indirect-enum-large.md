# perf-indirect-enum-large

> Mark large recursive enum cases `indirect` to bound size

## Why It Matters

A recursive `enum` (a tree, a JSON value, an AST node) without `indirect` requires the compiler to size the enum to fit its largest case inline, and a case that recursively contains itself has no finite size, which is a compile error. Marking the recursive case (or the whole enum) `indirect` boxes just that case on the heap, giving the enum a fixed, small in-line size while still allowing unbounded recursive structure—but every `indirect` case does add one heap allocation per node.

## Bad

```swift
// Won't compile: JSONValue.array/.object recursively contain JSONValue
// with no indirection, so the compiler can't determine a finite size.
enum JSONValue {
    case string(String)
    case number(Double)
    case array([JSONValue])       // OK: through Array, already indirect via storage
    case object([String: JSONValue])
    case wrapped(JSONValue)       // ERROR: infinite size without `indirect`
}
```

## Good

```swift
enum JSONValue {
    case string(String)
    case number(Double)
    case array([JSONValue])
    case object([String: JSONValue])
    indirect case wrapped(JSONValue) // only this case is heap-boxed
}

// Or, if most cases are recursive, mark the whole enum indirect once
// instead of annotating each case individually:
indirect enum Expression {
    case literal(Int)
    case add(Expression, Expression)
    case multiply(Expression, Expression)
    case negate(Expression)
}
```

## Trade-off: Boxing Cost vs. Case Size

```swift
// If only ONE case is large/recursive and the others are small and
// frequently constructed, mark just that case indirect rather than the
// whole enum, to avoid paying the heap-allocation cost for every case.
enum Node {
    case leaf(Int)                 // small, constructed often: keep inline
    indirect case branch(Node, Node) // recursive: boxed only here
}

// Marking the whole enum `indirect` would box leaf too, wasting an
// allocation on the common, non-recursive case.
```

## See Also

- [`type-enum-associated-values`](type-enum-associated-values.md) - Modeling data with enum associated values
- [`perf-value-type-copy-cost`](perf-value-type-copy-cost.md) - Copy cost trade-offs for large value types
- [`perf-profile-instruments`](perf-profile-instruments.md) - Measuring allocation cost from indirection
