# anti-deep-nesting-when

> Don't deeply nest `when`/`if` instead of using early returns or sealed dispatch

## Why It Matters

Each additional level of nested `if`/`when` doubles the number of paths a reader has to hold in their head to understand a single branch, and it's easy to lose track of which outer condition a deeply-indented line is actually inside. Flattening with early returns or dispatching on a sealed hierarchy keeps each branch's logic local and the overall control flow linear.

## Bad

```kotlin
fun processPayment(order: Order?): PaymentResult {
    if (order != null) {
        if (order.items.isNotEmpty()) {
            if (order.total > 0) {
                if (order.customer.isVerified) {
                    return chargeCard(order)
                } else {
                    return PaymentResult.Rejected("unverified customer")
                }
            } else {
                return PaymentResult.Rejected("zero total")
            }
        } else {
            return PaymentResult.Rejected("empty order")
        }
    } else {
        return PaymentResult.Rejected("no order")
    }
}
```

## Good

```kotlin
fun processPayment(order: Order?): PaymentResult {
    if (order == null) return PaymentResult.Rejected("no order")
    if (order.items.isEmpty()) return PaymentResult.Rejected("empty order")
    if (order.total <= 0) return PaymentResult.Rejected("zero total")
    if (!order.customer.isVerified) return PaymentResult.Rejected("unverified customer")

    return chargeCard(order)
}
```

```kotlin
// For dispatch on a closed set of states, use a sealed `when` at one
// level instead of nested type checks
sealed interface PaymentMethod {
    data class Card(val token: String) : PaymentMethod
    data class BankTransfer(val iban: String) : PaymentMethod
    data object Cash : PaymentMethod
}

fun describe(method: PaymentMethod): String = when (method) {
    is PaymentMethod.Card -> "Card ending in ${method.token.takeLast(4)}"
    is PaymentMethod.BankTransfer -> "Transfer to ${method.iban}"
    PaymentMethod.Cash -> "Cash"
}
```

## When It's Still Sometimes Seen

Two levels of nesting for a genuinely small, tightly related decision (a `when` inside a single `if` guard) is fine — the anti-pattern is specifically three-plus levels where each level could instead be an early return.

## See Also

- [`type-sealed-when-exhaustive`](type-sealed-when-exhaustive.md) - flatten type-based branching with exhaustive `when` instead of nested `is` checks
- [`err-require-precondition`](err-require-precondition.md) - `require`/`check` collapse several guard-clause nestings into one line
- [`lint-detekt-complexity-rules`](lint-detekt-complexity-rules.md) - `ComplexMethod`/`NestedBlockDepth` catch this automatically
