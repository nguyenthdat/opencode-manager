# api-protocol-oriented

> Design around protocols, not base classes

## Why It Matters

A base class forces every conformer into a single inheritance chain and couples them to shared stored state and initializer requirements, even when they only need to share behavior. A protocol describes a capability that any type — `struct`, `enum`, or `class` — can adopt, and a type can conform to many protocols at once, which composes far better than the single-parent constraint of class inheritance.

## Bad

```swift
class Shape {
    var fillColor: Color = .black

    func area() -> Double { fatalError("subclasses must override") }
    func perimeter() -> Double { fatalError("subclasses must override") }
}

class Circle: Shape {
    let radius: Double
    init(radius: Double) { self.radius = radius }
    override func area() -> Double { .pi * radius * radius }
    override func perimeter() -> Double { 2 * .pi * radius }
}

// A `Rectangle` that's also a value type, or that needs to conform to
// some unrelated hierarchy, has nowhere to go — Shape locks it into one chain.
```

## Good

```swift
protocol Shape {
    var fillColor: Color { get }
    func area() -> Double
    func perimeter() -> Double
}

struct Circle: Shape {
    var fillColor: Color = .black
    let radius: Double

    func area() -> Double { .pi * radius * radius }
    func perimeter() -> Double { 2 * .pi * radius }
}

struct Rectangle: Shape {
    var fillColor: Color = .black
    let width: Double
    let height: Double

    func area() -> Double { width * height }
    func perimeter() -> Double { 2 * (width + height) }
}

func totalArea(of shapes: [any Shape]) -> Double {
    shapes.reduce(0) { $0 + $1.area() }
}
```

## Adding Shared Behavior Without a Base Class

Protocol extensions provide the "shared implementation" benefit that used to require a base class, without forcing a single hierarchy — see `api-protocol-extension-default` for the full pattern:

```swift
extension Shape {
    var description: String {
        "area: \(area()), perimeter: \(perimeter())"
    }
}
```

## See Also

- [`api-protocol-extension-default`](api-protocol-extension-default.md) - sharing default behavior across conformers
- [`api-composition-over-inheritance`](api-composition-over-inheritance.md) - the broader principle this rule specializes
- [`api-protocol-associated-type`](api-protocol-associated-type.md) - generic contracts via associated types
- [`api-existential-any`](api-existential-any.md) - working with protocol values at runtime
