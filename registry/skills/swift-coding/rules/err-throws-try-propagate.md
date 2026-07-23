# err-throws-try-propagate

> Use `throws`/`try` to propagate recoverable errors

## Why It Matters

Marking a function `throws` and using `try` at call sites makes failure paths visible in the type system and at every call site, unlike returning a sentinel value or silently logging and returning a default. The `?` propagation via `try` (bubbling the error to the caller) keeps error-handling code out of the main logic until a layer actually knows how to recover, avoiding both silent failures and premature handling.

## Bad

```swift
// Returns a sentinel; caller has no idea -1 means "failed"
func parseAmount(_ text: String) -> Int {
    guard let value = Int(text) else { return -1 }
    return value
}

func processPayment(_ text: String) {
    let amount = parseAmount(text)
    if amount == -1 {
        print("something went wrong")   // Easy to forget this check
        return
    }
    submit(amount)
}
```

## Good

```swift
enum PaymentError: Error {
    case invalidAmount(String)
}

func parseAmount(_ text: String) throws -> Int {
    guard let value = Int(text) else {
        throw PaymentError.invalidAmount(text)
    }
    return value
}

func processPayment(_ text: String) throws {
    let amount = try parseAmount(text)   // Propagates automatically
    try submit(amount)
}

// Top-level caller decides how to handle it
do {
    try processPayment(userInput)
} catch PaymentError.invalidAmount(let text) {
    showAlert("'\(text)' is not a valid amount")
} catch {
    showAlert("Payment failed: \(error.localizedDescription)")
}
```

## Propagating Through Multiple Layers

```swift
struct PaymentService {
    func charge(_ text: String) throws -> Receipt {
        let amount = try parseAmount(text)
        let validated = try validate(amount)
        return try gateway.charge(validated)   // Each `try` propagates upward
    }
}
```

Each layer that can't meaningfully recover just re-throws with `try`; only the layer that can present an error to the user (or decide on a fallback) actually `catch`es it.

## See Also

- [`err-enum-error-type`](err-enum-error-type.md) - define the error types being thrown
- [`err-do-catch-specific`](err-do-catch-specific.md) - handle specific errors at the right layer
- [`err-typed-throws`](err-typed-throws.md) - narrow the throws contract further
- [`err-rethrows-generic`](err-rethrows-generic.md) - propagate closure errors through higher-order functions
