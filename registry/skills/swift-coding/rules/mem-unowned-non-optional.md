# mem-unowned-non-optional

> Use `unowned` only when lifetime is guaranteed non-nil

## Why It Matters

`unowned` gives you an unmanaged reference with none of `weak`'s safety net: if the referenced instance has already deallocated, accessing it is undefined behavior (typically an immediate crash) rather than a clean `nil`. Reach for `unowned` only when the lifetime relationship is structurally guaranteed — e.g. a child that cannot outlive its parent — otherwise a rare timing change turns into a hard crash instead of a graceful no-op.

## Bad

```swift
final class Order {
    var customer: Customer?
}

final class Customer {
    // Assumed to always outlive any Order that points back to it —
    // but nothing enforces that, and Orders can be cached beyond a session.
    unowned let placedBy: Customer

    init(placedBy: Customer) {
        self.placedBy = placedBy
    }
}

// Later, if `placedBy` deallocates before this Order is read, this crashes:
func printReferrer(_ order: Order) {
    print(order.customer?.placedBy.name ?? "none")
}
```

## Good

```swift
final class CreditCard {
    // A CreditCard is only ever created and held by its owning Customer,
    // and never escapes that Customer's lifetime — unowned is provably safe.
    unowned let owner: Customer

    init(owner: Customer) {
        self.owner = owner
    }
}

final class Customer {
    lazy var card = CreditCard(owner: self)
    let name: String
    init(name: String) { self.name = name }
}
```

## When `unowned(unsafe)` or `weak` Is the Better Fit

Use `weak` (and treat the reference as optional) whenever the back-reference might legitimately outlive the referenced object, or when you're not fully certain of the ownership graph:

```swift
final class Cache {
    weak var delegate: CacheDelegate?   // delegate lifetime is independent of Cache
}
```

Avoid `unowned(unsafe)` entirely outside of measured, documented performance-critical code — it skips even the runtime check that `unowned` performs, trading a crash for silent memory corruption.

| Reference kind | Nil-able | Cost | Failure mode |
|---|---|---|---|
| `weak` | Yes | Small runtime overhead | Becomes `nil` safely |
| `unowned` | No | None | Traps (crash) if deallocated |
| `unowned(unsafe)` | No | None | Undefined behavior if deallocated |

## See Also

- [`mem-weak-self-closure`](mem-weak-self-closure.md) - prefer weak in escaping closures
- [`mem-weak-delegate`](mem-weak-delegate.md) - delegate references should default to weak
- [`mem-deinit-verify`](mem-deinit-verify.md) - verify assumed lifetimes actually hold
