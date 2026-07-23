# name-func-lower-camel

> Use `lowerCamelCase` for functions, methods, and properties

## Why It Matters

Value-level identifiers—functions, methods, properties, and local variables—use `lowerCamelCase` in Swift, mirroring the standard library and Apple's frameworks. This casing convention is the primary visual cue that separates "things you call or read" from "types you declare," and inconsistent casing makes code reviews and autocomplete lists harder to scan.

## Bad

```swift
struct OrderService {
    var Total_Amount: Double
    var IsShipped: Bool

    func CalculateTax() -> Double { ... }
    func fetch_order(ID: Int) -> Order? { ... }
    func Process() throws { ... }
}
```

## Good

```swift
struct OrderService {
    var totalAmount: Double
    var isShipped: Bool

    func calculateTax() -> Double { ... }
    func fetchOrder(id: Int) -> Order? { ... }
    func process() throws { ... }
}
```

## Local Variables and Closures

```swift
func summarize(orders: [Order]) -> String {
    let totalCount = orders.count
    let shippedOrders = orders.filter { $0.isShipped }
    let averageValue = orders.map(\.totalAmount).reduce(0, +) / Double(totalCount)

    let formatCurrency: (Double) -> String = { amount in
        amount.formatted(.currency(code: "USD"))
    }

    return "\(shippedOrders.count)/\(totalCount) shipped, avg \(formatCurrency(averageValue))"
}
```

## See Also

- [`name-type-upper-camel`](name-type-upper-camel.md) - Casing for types and protocols
- [`name-boolean-assertive`](name-boolean-assertive.md) - Naming Boolean properties
- [`name-avoid-abbreviation`](name-avoid-abbreviation.md) - Avoid unclear abbreviations
