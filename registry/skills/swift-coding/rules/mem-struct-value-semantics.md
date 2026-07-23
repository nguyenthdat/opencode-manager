# mem-struct-value-semantics

> Prefer `struct`/`enum` value types over `class` by default

## Why It Matters

Value types copy on assignment and pass-by-value across function boundaries, so each owner has an independent, thread-safe snapshot with no shared mutable state to race on. Classes share identity: mutating one reference silently mutates every other reference to the same instance, which produces action-at-a-distance bugs that are hard to trace, and makes the type unsafe to share across concurrency domains without extra synchronization.

## Bad

```swift
final class Point {
    var x: Double
    var y: Double
    init(x: Double, y: Double) { self.x = x; self.y = y }
}

func offset(_ point: Point, dx: Double) -> Point {
    point.x += dx   // mutates the caller's instance too — shared reference
    return point
}

let origin = Point(x: 0, y: 0)
let moved = offset(origin, dx: 10)
// origin.x is now 10 as well — surprising aliasing bug
```

## Good

```swift
struct Point {
    var x: Double
    var y: Double
}

func offset(_ point: Point, dx: Double) -> Point {
    var copy = point
    copy.x += dx
    return copy
}

let origin = Point(x: 0, y: 0)
let moved = offset(origin, dx: 10)
// origin.x is still 0; moved is an independent value
```

## When a Class Is Justified

Reach for `class` only when you need shared, mutable identity that multiple owners must observe consistently — see `mem-class-when-identity` for the criteria. A common hybrid is a value-type model backed by a reference-type controller:

```swift
struct Account {
    var balance: Decimal   // value semantics for the data
}

@Observable
final class AccountStore {   // reference semantics for the shared, observed state
    private(set) var account: Account

    init(account: Account) { self.account = account }

    func deposit(_ amount: Decimal) {
        account.balance += amount
    }
}
```

## See Also

- [`mem-class-when-identity`](mem-class-when-identity.md) - the criteria for choosing a class instead
- [`api-struct-over-class-default`](api-struct-over-class-default.md) - the same default at the API-design level
- [`api-immutable-by-default`](api-immutable-by-default.md) - pairing value types with `let`
- [`mem-cow-custom-collection`](mem-cow-custom-collection.md) - keeping value semantics efficient for large data
