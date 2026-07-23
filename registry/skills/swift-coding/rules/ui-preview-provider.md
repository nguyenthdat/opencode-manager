# ui-preview-provider

> Provide `#Preview` for every non-trivial view

## Why It Matters

Without a preview, verifying a view's appearance requires building and running the whole app, navigating to the screen, and reproducing whatever state (empty list, error, loading) you want to check — a slow loop that discourages iterating on layout. `#Preview` renders the view directly in Xcode's canvas with whatever sample data you supply, including edge cases like empty or error states that might otherwise be hard to reach manually, dramatically shortening the design-and-check cycle.

## Bad

```swift
struct OrderSummaryView: View {
    let order: Order

    var body: some View {
        VStack(alignment: .leading) {
            Text(order.id).font(.headline)
            Text("Total: \(order.total)")
            if order.items.isEmpty {
                Text("No items")
            }
        }
    }
}
// No preview: checking the empty-items branch means finding/creating
// a real empty order and running the full app to reach this screen.
```

## Good

```swift
struct OrderSummaryView: View {
    let order: Order

    var body: some View {
        VStack(alignment: .leading) {
            Text(order.id).font(.headline)
            Text("Total: \(order.total)")
            if order.items.isEmpty {
                Text("No items")
            }
        }
    }
}

#Preview("Typical Order") {
    OrderSummaryView(order: .sample)
}

#Preview("Empty Order") {
    OrderSummaryView(order: .sampleEmpty)
}

extension Order {
    static let sample = Order(id: "A-1001", total: 42.50, items: [.sample])
    static let sampleEmpty = Order(id: "A-1002", total: 0, items: [])
}
```

## Previewing With Environment/Injected Dependencies

Supply mock dependencies through the same `.environment`/initializer injection points used in production, rather than reaching for singletons that make previews depend on live state:

```swift
#Preview("Signed In") {
    ProfileHeader()
        .environment(UserSession.mock(name: "Ada Lovelace"))
}
```

Reserve `#Preview` for views with meaningful layout or state variation; a trivial one-line wrapper view doesn't need its own preview if its parent's preview already exercises it.

## See Also

- [`ui-view-small-composable`](ui-view-small-composable.md) - small subviews are exactly what benefits most from individual previews
- [`ui-identifiable-list-data`](ui-identifiable-list-data.md) - sample list data for previewing `ForEach`-driven views
- [`test-snapshot-testing`](test-snapshot-testing.md) - turning preview configurations into automated regression coverage
