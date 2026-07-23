# type-optional-pattern-match

> Use `case let x?`/`switch` pattern matching for optionals

## Why It Matters

`switch` with pattern matching lets you handle an optional's `nil` and non-nil cases — and an enum's associated values — exhaustively and declaratively in one construct, which the compiler checks for completeness. This scales better than chains of `if let`/`else if let` when there are several related cases to distinguish, and it keeps binding and dispatch in the same place.

## Bad

```swift
func describe(_ value: Int?) -> String {
    if let value = value {
        if value > 0 {
            return "Positive: \(value)"
        } else if value < 0 {
            return "Negative: \(value)"
        } else {
            return "Zero"
        }
    } else {
        return "No value"
    }
}
```

## Good

```swift
func describe(_ value: Int?) -> String {
    switch value {
    case .some(let v) where v > 0:
        return "Positive: \(v)"
    case .some(let v) where v < 0:
        return "Negative: \(v)"
    case .some:
        return "Zero"
    case .none:
        return "No value"
    }
}

// Shorthand `?` pattern for Optional.some
func shortDescribe(_ value: Int?) -> String {
    switch value {
    case let v? where v > 0:
        return "Positive: \(v)"
    case let v?:
        return "Non-positive: \(v)"
    case nil:
        return "No value"
    }
}
```

## Pattern Matching Enum Associated Values

```swift
enum Shape {
    case circle(radius: Double)
    case rectangle(width: Double, height: Double)
}

func area(of shape: Shape) -> Double {
    switch shape {
    case .circle(let radius):
        return .pi * radius * radius
    case .rectangle(let width, let height):
        return width * height
    }
}

// `if case` for a single case check, without needing a full switch
if case .circle(let radius) = shape, radius > 10 {
    print("Large circle")
}

// `for case` to filter while iterating
let shapes: [Shape] = [.circle(radius: 1), .rectangle(width: 2, height: 3)]
for case .circle(let radius) in shapes {
    print("Circle radius: \(radius)")
}
```

## See Also

- [`type-enum-associated-values`](type-enum-associated-values.md) - model state as enums to pattern match against
- [`type-multi-optional-binding`](type-multi-optional-binding.md) - combine bindings in if/guard let
- [`err-do-catch-specific`](err-do-catch-specific.md) - the same pattern-matching idea applied to catch clauses
