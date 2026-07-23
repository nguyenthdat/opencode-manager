# anti-force-unwrap-abuse

> Don't force-unwrap optionals in production code

## Why It Matters

Every `!` on an optional is a promise to the compiler that the value can never be `nil` at that point — a promise that isn't re-checked as the surrounding code evolves. The optional was almost always introduced because the value *can* legitimately be absent (a missing dictionary key, a failed parse, an unset network response field); force-unwrapping it just moves the failure from a handled `nil` case to an unhandled runtime crash, often far from where the actual bug was introduced.

## Bad

```swift
func processPayment(userInfo: [String: Any]) {
    let amount = userInfo["amount"] as! Double        // crashes if key missing or wrong type
    let currency = userInfo["currency"] as! String
    let account = fetchAccount(id: userInfo["accountID"] as! String)!  // two more crash points

    charge(account: account, amount: amount, currency: currency)
}
```

## Good

```swift
func processPayment(userInfo: [String: Any]) throws {
    guard
        let amount = userInfo["amount"] as? Double,
        let currency = userInfo["currency"] as? String,
        let accountID = userInfo["accountID"] as? String
    else {
        throw PaymentError.malformedRequest
    }

    guard let account = fetchAccount(id: accountID) else {
        throw PaymentError.accountNotFound(accountID)
    }

    charge(account: account, amount: amount, currency: currency)
}
```

## The Narrow Exception

A force unwrap is defensible only when `nil` would represent a genuine programmer error that should crash immediately in development — e.g., a resource bundled with the app that must exist, or a regex literal built from a hardcoded, known-valid pattern — and even then, prefer `guard let ... else { fatalError(...) }` or `precondition` so the failure carries a message:

```swift
guard let iconURL = Bundle.main.url(forResource: "AppIcon", withExtension: "png") else {
    fatalError("AppIcon.png missing from bundle — this is a build configuration error, not a runtime condition")
}
```

## See Also

- [`type-no-force-unwrap`](type-no-force-unwrap.md) - the positive-form rule this anti-pattern violates
- [`lint-force-unwrap-rule`](lint-force-unwrap-rule.md) - enforce this automatically via SwiftLint
- [`type-iuo-boundary-only`](type-iuo-boundary-only.md) - the related IUO discipline
- [`anti-force-cast-abuse`](anti-force-cast-abuse.md) - the force-cast sibling of this anti-pattern
