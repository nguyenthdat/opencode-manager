# type-enum-associated-values

> Model closed state with `enum` + associated values, not parallel optionals

## Why It Matters

A struct with several optional properties that are supposed to be mutually exclusive lets invalid combinations compile — two "modes" set at once, or none at all — and forces every reader to reverse-engineer which optionals are valid together. An `enum` with associated values makes each state a single, exhaustively-checked case, so the compiler enforces validity and `switch` guarantees you've handled every state.

## Bad

```swift
struct LoadingState {
    var isLoading: Bool
    var data: [Item]?
    var error: Error?
    // Nothing stops isLoading == true && data != nil && error != nil
    // all being set at the same time, which is meaningless.
}

func render(_ state: LoadingState) {
    if state.isLoading {
        showSpinner()
    } else if let error = state.error {
        showError(error)
    } else if let data = state.data {
        showData(data)
    }
    // Easy to forget a case, and the compiler won't warn you.
}
```

## Good

```swift
enum LoadingState {
    case loading
    case loaded([Item])
    case failed(Error)
}

func render(_ state: LoadingState) {
    switch state {
    case .loading:
        showSpinner()
    case .loaded(let items):
        showData(items)
    case .failed(let error):
        showError(error)
    }
    // Adding a new case forces every switch to be updated (with no `default`).
}
```

## Modeling Richer States

```swift
enum NetworkResult<Value> {
    case success(Value)
    case failure(APIError)
    case cancelled
}

enum PaymentMethod {
    case creditCard(number: String, expiry: Date)
    case applePay
    case bankTransfer(iban: String)
}

func fee(for method: PaymentMethod) -> Decimal {
    switch method {
    case .creditCard: return 0.029
    case .applePay: return 0.015
    case .bankTransfer: return 0.0
    }
}
```

Reach for this whenever you notice a group of optional/boolean properties on a type where only certain combinations are ever meaningful — that's the signature of a state machine hiding inside a struct.

## See Also

- [`type-optional-pattern-match`](type-optional-pattern-match.md) - switch/case let for enum associated values
- [`type-non-optional-default`](type-non-optional-default.md) - avoid optionals when a real default exists
- [`err-enum-error-type`](err-enum-error-type.md) - the same technique applied to error types
