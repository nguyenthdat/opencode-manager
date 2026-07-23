# ui-state-source-of-truth

> Keep a single source of truth with `@State`/`@Observable`

## Why It Matters

When the same piece of information is duplicated across multiple `@State` properties or views, they can drift out of sync — one gets updated, the other doesn't, and the UI shows contradictory information. Deriving every other value from a single source of truth (one `@State`/`@Observable` property, with everything else computed from it) guarantees the UI can never disagree with itself.

## Bad

```swift
struct CartView: View {
    @State private var items: [Item] = []
    @State private var itemCount: Int = 0        // duplicates items.count
    @State private var isEmpty: Bool = true      // duplicates items.isEmpty

    var body: some View {
        VStack {
            Text("\(itemCount) items")
            if isEmpty {
                Text("Your cart is empty")
            }
        }
        // Every mutation to `items` must remember to also update
        // itemCount and isEmpty, or they silently go stale.
    }
}
```

## Good

```swift
struct CartView: View {
    @State private var items: [Item] = []

    private var itemCount: Int { items.count }       // always derived, never stale
    private var isEmpty: Bool { items.isEmpty }

    var body: some View {
        VStack {
            Text("\(itemCount) items")
            if isEmpty {
                Text("Your cart is empty")
            }
        }
    }
}
```

## Single Source of Truth Across a Feature

The same principle scales up: an `@Observable` model should be the one place a feature's state lives, with views only reading and requesting changes through it rather than keeping parallel copies:

```swift
@Observable
final class CartModel {
    private(set) var items: [Item] = []

    var itemCount: Int { items.count }

    func add(_ item: Item) {
        items.append(item)
    }
}

struct CartView: View {
    let model: CartModel

    var body: some View {
        Text("\(model.itemCount) items")   // always reflects the model, nothing duplicated locally
    }
}
```

## See Also

- [`ui-observable-macro`](ui-observable-macro.md) - the modern mechanism for shared observed state
- [`ui-binding-two-way`](ui-binding-two-way.md) - passing a source of truth down for child mutation
- [`ui-no-business-logic-in-view`](ui-no-business-logic-in-view.md) - keeping derivation logic in the model, not scattered in views
