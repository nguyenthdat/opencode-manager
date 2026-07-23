# anti-massive-view-controller

> Don't build Massive View Controller/God objects

## Why It Matters

A view controller (or SwiftUI view/view model) that owns networking, persistence, validation, analytics, navigation, and layout all in one type becomes untestable (you can't unit test layout logic without spinning up networking), unreadable (finding the one method you need to change means scrolling through a thousand unrelated lines), and impossible to safely change (any edit risks breaking something in a completely unrelated responsibility bundled into the same type). It grows this way gradually — one more property, one more method — until it's the single riskiest file in the codebase to touch.

## Bad

```swift
class OrderViewController: UIViewController {
    var orderItems: [Item] = []
    var apiClient = URLSession.shared
    var database: SQLiteConnection!
    var analyticsQueue: [Event] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        fetchOrder()
    }

    func fetchOrder() { /* networking inline */ }
    func validateAddress(_ address: String) -> Bool { /* validation inline */ }
    func saveToLocalCache() { /* persistence inline */ }
    func trackAnalyticsEvent(_ name: String) { /* analytics inline */ }
    func layoutSubviews() { /* 200 lines of manual frame math */ }
    func navigateToCheckout() { /* navigation inline */ }
    // ... 1,500 more lines across a dozen more unrelated responsibilities
}
```

## Good

```swift
struct OrderViewModel {
    private let orderService: OrderServicing
    private let analytics: AnalyticsTracking

    func loadOrder() async throws -> Order {
        let order = try await orderService.fetchOrder()
        analytics.track(.orderLoaded)
        return order
    }
}

struct AddressValidator {
    func validate(_ address: String) -> Bool { /* ... */ }
}

final class OrderViewController: UIViewController {
    private let viewModel: OrderViewModel
    // Only owns presentation: loads state via viewModel, delegates everything else out.

    override func viewDidLoad() {
        super.viewDidLoad()
        Task { order = try await viewModel.loadOrder() }
    }
}
```

Each responsibility (networking, validation, analytics) is now its own independently testable type; the view controller's only job is presenting what the view model gives it.

## See Also

- [`ui-avoid-massive-view`](ui-avoid-massive-view.md) - the positive-form rule this anti-pattern violates
- [`ui-no-business-logic-in-view`](ui-no-business-logic-in-view.md) - the specific business-logic extraction discipline
- [`lint-cyclomatic-complexity`](lint-cyclomatic-complexity.md) - automated detection via type/function length rules
- [`anti-god-protocol`](anti-god-protocol.md) - the protocol-design analog of this same over-bundling problem
