# perf-avoid-existential-boxing

> Avoid excessive `any` existential boxing in hot paths

## Why It Matters

An `any Protocol` existential that doesn't fit in Swift's small inline buffer (three words) is boxed on the heap, and every call through it goes through dynamic witness-table dispatch instead of static dispatch. In a hot loop processing many elements through an existential-typed collection or parameter, that boxing and indirect dispatch adds measurable overhead compared to a generic (`some Protocol` / `<T: Protocol>`) that the compiler can specialize and often inline.

## Bad

```swift
protocol Shape {
    func area() -> Double
}

// Boxes every element; each area() call is a dynamic dispatch through
// a witness table, and large conforming structs get heap-allocated.
func totalArea(_ shapes: [any Shape]) -> Double {
    shapes.reduce(0) { $0 + $1.area() }
}

func makeShape(sides: Int) -> any Shape {
    sides == 4 ? Square(side: 2) : Circle(radius: 1)
}
```

## Good

```swift
protocol Shape {
    func area() -> Double
}

// Generic constraint: the compiler can specialize per concrete type,
// enabling static dispatch and often full inlining.
func totalArea<S: Shape>(_ shapes: [S]) -> Double {
    shapes.reduce(0) { $0 + $1.area() }
}

// `some Shape` returns a single concrete (but caller-opaque) type,
// avoiding the existential box entirely.
func makeSquare(side: Double) -> some Shape {
    Square(side: side)
}
```

## When Existentials Are the Right Tool

```swift
// Heterogeneous collections genuinely need `any`: there is no single
// concrete type to specialize a generic over.
struct Canvas {
    var shapes: [any Shape] // Square, Circle, Triangle all mixed together

    func totalArea() -> Double {
        shapes.reduce(0) { $0 + $1.area() } // acceptable: heterogeneity requires boxing
    }
}

// For non-hot-path code (UI setup, configuration, one-off calls),
// the dispatch overhead of `any` is immaterial—don't reach for generics
// there just for theoretical speed; see perf-profile-instruments first.
```

## See Also

- [`api-existential-any`](api-existential-any.md) - When `any` existentials are appropriate
- [`perf-profile-instruments`](perf-profile-instruments.md) - Measuring before optimizing dispatch
- [`perf-inline-hot-path`](perf-inline-hot-path.md) - Further hot-path specialization tools
