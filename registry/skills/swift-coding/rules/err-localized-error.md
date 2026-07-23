# err-localized-error

> Conform errors to `LocalizedError` for user-facing messages

## Why It Matters

By default, `String(describing:)` on a custom `Error` prints an unhelpful case name like `invalidAmount("abc")`, which is fine for logs but useless in a user-facing alert. Conforming to `LocalizedError` and implementing `errorDescription` (and optionally `failureReason`/`recoverySuggestion`) gives you one canonical place to define human-readable, localizable messages that `error.localizedDescription` and SwiftUI's `Text(error.localizedDescription)` will pick up automatically.

## Bad

```swift
enum PaymentError: Error {
    case cardDeclined
    case insufficientFunds(available: Decimal)
}

func showError(_ error: Error) {
    // Falls back to something like "PaymentError.insufficientFunds(available: 12.5)"
    alert.message = error.localizedDescription
}
```

## Good

```swift
enum PaymentError: LocalizedError {
    case cardDeclined
    case insufficientFunds(available: Decimal)

    var errorDescription: String? {
        switch self {
        case .cardDeclined:
            return "Your card was declined."
        case .insufficientFunds(let available):
            return "Insufficient funds. Available balance: \(available.formatted(.currency(code: "USD")))."
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .cardDeclined:
            return "Please try a different payment method."
        case .insufficientFunds:
            return "Add funds to your account and try again."
        }
    }
}

func showError(_ error: Error) {
    alert.message = error.localizedDescription   // Now uses errorDescription
}
```

## Full LocalizedError Surface

```swift
protocol LocalizedError: Error {
    var errorDescription: String? { get }     // What went wrong
    var failureReason: String? { get }        // Why it happened
    var recoverySuggestion: String? { get }   // What the user can do
    var helpAnchor: String? { get }           // Link into help documentation
}

// All four have default nil implementations, so implement only what applies.
extension PaymentError {
    var failureReason: String? {
        switch self {
        case .cardDeclined: return "The issuing bank rejected the transaction."
        case .insufficientFunds: return nil
        }
    }
}
```

Reserve `LocalizedError` for errors that actually surface to end users; internal/diagnostic errors are fine without it since only developers read them.

## See Also

- [`err-enum-error-type`](err-enum-error-type.md) - the enum error definitions this rule extends
- [`err-error-context`](err-error-context.md) - attach machine-readable context alongside the user message
- [`interop-ns-error-domain`](interop-ns-error-domain.md) - the NSError-backed equivalent for Objective-C interop
