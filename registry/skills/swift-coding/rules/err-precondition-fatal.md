# err-precondition-fatal

> Use `precondition`/`fatalError` only for programmer errors

## Why It Matters

`precondition` and `fatalError` crash the process immediately and unconditionally — appropriate only for violations of a contract the *calling code* controls (an invariant, an unreachable `switch` branch, a required configuration step skipped by a developer). Using them for conditions that arise from untrusted input, network responses, or the filesystem crashes the app in response to normal, user-triggered situations that should instead be modeled as recoverable errors.

## Bad

```swift
func withdraw(_ amount: Decimal, from account: Account) {
    // A user entering an amount larger than their balance is a normal,
    // expected outcome — not a programmer error. This will crash the
    // app every time someone fat-fingers a withdrawal amount.
    precondition(amount <= account.balance, "Insufficient funds")
    account.balance -= amount
}

func decode(_ data: Data) -> Config {
    // Malformed data from the network is not a programmer bug either.
    guard let config = try? JSONDecoder().decode(Config.self, from: data) else {
        fatalError("Invalid config data")
    }
    return config
}
```

## Good

```swift
enum WithdrawalError: Error {
    case insufficientFunds(requested: Decimal, available: Decimal)
}

func withdraw(_ amount: Decimal, from account: Account) throws {
    guard amount <= account.balance else {
        throw WithdrawalError.insufficientFunds(requested: amount, available: account.balance)
    }
    account.balance -= amount
}

func decode(_ data: Data) throws -> Config {
    try JSONDecoder().decode(Config.self, from: data)
}

// precondition/fatalError reserved for actual programmer contracts:
struct Percentage {
    let value: Double
    init(_ value: Double) {
        precondition((0...1).contains(value), "Percentage must be in 0...1, got \(value)")
        self.value = value
    }
}

func area(of shape: Shape) -> Double {
    switch shape {
    case .circle(let r): return .pi * r * r
    case .rectangle(let w, let h): return w * h
    @unknown default:
        fatalError("Unhandled Shape case — update area(of:) after adding a case")
    }
}
```

## precondition vs assert vs fatalError

```swift
// assert: only active in debug builds, stripped in release — for
// catching bugs during development without any release-build cost.
assert(index < array.count, "Index out of bounds")

// precondition: active in both debug and release — for invariants that
// must hold in production too, where continuing would corrupt state.
precondition(index < array.count, "Index out of bounds")

// fatalError: always active, used for genuinely unreachable code paths.
fatalError("This should never be reached")
```

Reserve these for conditions where continuing execution would be *worse* than crashing — memory corruption, an invariant your own code is supposed to guarantee, or a `switch` case you added but forgot to handle everywhere.

## See Also

- [`type-no-force-unwrap`](type-no-force-unwrap.md) - the optional-unwrap analog of this decision
- [`err-enum-error-type`](err-enum-error-type.md) - model user/runtime failures as recoverable errors instead
- [`err-never-swallow`](err-never-swallow.md) - the opposite failure mode: under-reacting to real errors
