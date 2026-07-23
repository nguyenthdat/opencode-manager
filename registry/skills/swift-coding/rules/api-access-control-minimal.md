# api-access-control-minimal

> Default to the narrowest access level that works

## Why It Matters

Every symbol exposed beyond what's actually needed becomes part of your public contract: callers can depend on it, which means you can no longer change or remove it without breaking them. Starting from `private`/`fileprivate` (or `internal` for module-wide, non-package use) and widening only when a real caller outside that scope needs access keeps the surface area — and the future maintenance burden — as small as possible.

## Bad

```swift
public struct InvoiceCalculator {
    public var taxRate: Double = 0.08              // no reason for external mutation
    public var subtotalCache: [String: Double] = [:]  // implementation detail leaked

    public func computeTax(on amount: Double) -> Double {
        amount * taxRate
    }

    public func cacheKey(for id: String) -> String {   // internal helper, exposed publicly
        "invoice-\(id)"
    }
}
```

## Good

```swift
public struct InvoiceCalculator {
    private var subtotalCache: [String: Double] = [:]
    private let taxRate: Double

    public init(taxRate: Double = 0.08) {
        self.taxRate = taxRate
    }

    public func computeTax(on amount: Double) -> Double {
        amount * taxRate
    }

    private func cacheKey(for id: String) -> String {
        "invoice-\(id)"
    }
}
```

## Choosing Among the Levels

| Level | Visible to | Use when |
|---|---|---|
| `private` | Enclosing declaration (and extensions in same file, Swift 4+) | Implementation detail of one type |
| `fileprivate` | Same file | Shared helper among a few closely related types in one file |
| `internal` (default) | Same module | Anything not part of the module's public API |
| `public` | Any module importing this one | Deliberate API surface, stable contract |
| `open` | Any module, subclassable/overridable | Framework classes explicitly designed for external subclassing |

Widen access one step at a time and only in response to an actual caller's need — never default to `public` "in case it's useful later." For package-internal-but-cross-module APIs, prefer the `package` access level (Swift 5.9+) instead of jumping straight to `public`.

## See Also

- [`proj-internal-by-default`](proj-internal-by-default.md) - applying this at the package/target level
- [`api-immutable-by-default`](api-immutable-by-default.md) - narrowing mutability alongside visibility
- [`doc-public-api-required`](doc-public-api-required.md) - documentation obligations that come with `public`
