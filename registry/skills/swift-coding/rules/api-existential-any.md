# api-existential-any

> Mark existential protocol types with explicit `any`

## Why It Matters

Since Swift 5.6/5.7, using a protocol as a standalone type (an "existential") requires the explicit `any` keyword, making clear at the use site that you're paying for dynamic dispatch and, potentially, existential boxing overhead — rather than the static, generic dispatch of `some`/generic constraints. Writing `any` explicitly (instead of relying on older code that predates the requirement) documents that a heterogeneous collection or dynamic value is intended, and makes it easy to spot places that could be tightened to a concrete generic for better performance.

## Bad

```swift
protocol PaymentMethod {
    func charge(_ amount: Decimal) throws
}

// Ambiguous under modern Swift: is this an existential, a generic constraint,
// or a typo? (Older code before Swift 5.6 wrote it exactly like this.)
func process(_ method: PaymentMethod, amount: Decimal) throws {
    try method.charge(amount)
}

var methods: [PaymentMethod] = []
```

## Good

```swift
protocol PaymentMethod {
    func charge(_ amount: Decimal) throws
}

// Explicit `any`: a heterogeneous collection genuinely needs dynamic dispatch.
var methods: [any PaymentMethod] = []

// Explicit `some`: this call site only ever needs one concrete conforming type,
// so a generic gets static dispatch and avoids existential overhead.
func process(_ method: some PaymentMethod, amount: Decimal) throws {
    try method.charge(amount)
}
```

## `any` vs `some` vs Generic Constraint

| Form | Dispatch | Use when |
|---|---|---|
| `some PaymentMethod` (parameter/opaque return) | Static | Single concrete type per call, best performance |
| `<T: PaymentMethod>` generic | Static | Same as `some`, but needs the type name elsewhere in the signature |
| `any PaymentMethod` | Dynamic | Heterogeneous storage (arrays, dictionaries) or truly unknown-at-compile-time type |

```swift
// Heterogeneous storage genuinely needs `any`:
let wallet: [any PaymentMethod] = [CreditCard(), ApplePay(), Cash()]
for method in wallet {
    try? method.charge(10)
}
```

## See Also

- [`api-protocol-associated-type`](api-protocol-associated-type.md) - associated-type protocols usually can't be `any` without a type eraser
- [`perf-avoid-existential-boxing`](perf-avoid-existential-boxing.md) - the performance cost `any` can introduce in hot paths
- [`api-protocol-oriented`](api-protocol-oriented.md) - the broader protocol design this keyword clarifies
