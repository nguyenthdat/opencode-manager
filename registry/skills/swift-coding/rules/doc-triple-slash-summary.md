# doc-triple-slash-summary

> Start `///` docs with a one-line summary

## Why It Matters

Xcode's Quick Help, jump-to-definition popovers, and DocC all render only the first paragraph of a `///` comment when space is limited, so that first line has to stand alone as a complete, scannable description. A doc comment that opens with background context or a multi-sentence ramble before getting to the point wastes the one line most readers will actually see.

## Bad

```swift
/// This function is used in the checkout flow and was added when we
/// integrated the new tax provider. It takes a cart and computes things.
/// Eventually returns a total.
func calculateTotal(for cart: Cart) -> Double {
    ...
}

/// Handles user stuff.
struct UserService {
    ...
}
```

## Good

```swift
/// Calculates the final checkout total, including tax and shipping.
///
/// This is used by the checkout flow after the tax provider has been
/// configured; see ``TaxProvider`` for how tax rates are resolved.
func calculateTotal(for cart: Cart) -> Double {
    ...
}

/// Creates, authenticates, and manages the current user's session.
struct UserService {
    ...
}
```

## One-Line Summary, Then Elaborate

```swift
/// Returns the shortest path between two nodes using Dijkstra's algorithm.
///
/// The graph must have non-negative edge weights. For graphs with negative
/// weights, use ``bellmanFord(from:to:)`` instead.
///
/// - Parameters:
///   - start: The node to begin the search from.
///   - end: The destination node.
/// - Returns: The path as an ordered list of nodes, or `nil` if unreachable.
func shortestPath(from start: Node, to end: Node) -> [Node]? {
    ...
}
```

## See Also

- [`doc-docc-parameters`](doc-docc-parameters.md) - Documenting parameters after the summary
- [`doc-public-api-required`](doc-public-api-required.md) - Which symbols require doc comments
- [`doc-code-listing-example`](doc-code-listing-example.md) - Adding runnable examples below the summary
