# ui-no-business-logic-in-view

> Keep business logic out of `View` bodies; delegate to models

## Why It Matters

A `View`'s `body` is a pure description of layout computed possibly many times per second during animations and state changes, so any business logic embedded there (validation, formatting rules, network calls, filtering algorithms) re-runs on every re-render and is untestable without instantiating the entire view hierarchy. Moving that logic into a plain model/service type lets it be unit-tested directly and keeps `body` fast and side-effect-free.

## Bad

```swift
struct CheckoutView: View {
    let items: [CartItem]

    var body: some View {
        // business logic embedded directly in the view: re-computed on every
        // render, and can't be unit-tested without rendering a View
        let subtotal = items.reduce(Decimal(0)) { $0 + $1.price * Decimal($1.quantity) }
        let tax = subtotal * 0.08
        let eligible = subtotal > 50
        let discount = eligible ? subtotal * 0.1 : 0
        let total = subtotal + tax - discount

        VStack {
            Text("Total: \(total)")
            if eligible {
                Text("10% discount applied")
            }
        }
    }
}
```

## Good

```swift
struct CheckoutSummary: Equatable {
    let subtotal: Decimal
    let tax: Decimal
    let discount: Decimal
    let total: Decimal
    let discountApplied: Bool
}

enum CheckoutCalculator {
    static func summarize(_ items: [CartItem]) -> CheckoutSummary {
        let subtotal = items.reduce(Decimal(0)) { $0 + $1.price * Decimal($1.quantity) }
        let tax = subtotal * 0.08
        let eligible = subtotal > 50
        let discount = eligible ? subtotal * 0.1 : 0
        return CheckoutSummary(subtotal: subtotal, tax: tax, discount: discount,
                                total: subtotal + tax - discount, discountApplied: eligible)
    }
}

struct CheckoutView: View {
    let summary: CheckoutSummary   // view only renders a precomputed value

    var body: some View {
        VStack {
            Text("Total: \(summary.total)")
            if summary.discountApplied {
                Text("10% discount applied")
            }
        }
    }
}
```

## Testing the Logic Independently

Because the logic no longer lives in `body`, it can be tested directly with no view rendering involved:

```swift
import Testing

@Test func discountAppliesAboveThreshold() {
    let items = [CartItem(price: 60, quantity: 1)]
    let summary = CheckoutCalculator.summarize(items)
    #expect(summary.discountApplied)
}
```

## See Also

- [`ui-avoid-massive-view`](ui-avoid-massive-view.md) - the broader anti-pattern this rule prevents
- [`ui-state-source-of-truth`](ui-state-source-of-truth.md) - keeping derived values consistent outside the view
- [`test-protocol-mock-injection`](test-protocol-mock-injection.md) - testing the extracted model layer in isolation
