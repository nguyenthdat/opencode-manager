# anti-stringly-typed-data

> Don't represent structured domain data as ad hoc strings

## Why It Matters

Encoding a status, an ID, or a currency amount as a bare `String` throws away the compiler's ability to catch mistakes: `"active"` vs `"Active"` vs `"ACTIVE"` all compile fine and fail silently at runtime, and nothing stops `userId` and `orderId` (both `String`) from being swapped at a call site. Modeling the same data as a proper type turns those runtime bugs into compile-time errors.

## Bad

```kotlin
fun updateStatus(orderId: String, status: String) {
    // "shipped" vs "Shipped" vs "SHIPPED" - which one does this expect?
    if (status == "shipped") { /* ... */ }
}

// Nothing stops these from being passed in the wrong order - both String
fun transfer(fromAccountId: String, toAccountId: String, amountCents: String) {
    val amount = amountCents.toLong() // parse failure only caught at runtime
}

updateStatus(orderId = "shipped", status = "ord-42") // compiles, wrong, crashes later
```

## Good

```kotlin
enum class OrderStatus { PENDING, SHIPPED, DELIVERED, CANCELLED }

@JvmInline value class OrderId(val value: String)
@JvmInline value class AccountId(val value: String)

fun updateStatus(orderId: OrderId, status: OrderStatus) {
    if (status == OrderStatus.SHIPPED) { /* ... */ }
}

fun transfer(fromAccountId: AccountId, toAccountId: AccountId, amount: Money) {
    // Swapping arguments, or passing an OrderId here, is now a compile error
}

updateStatus(orderId = OrderId("ord-42"), status = OrderStatus.SHIPPED) // compiler-checked
```

## When It's Still Sometimes Seen

```kotlin
// Genuinely free-form, user-authored text (a search query, a comment body)
// has no fixed domain of valid values - String really is the right type
data class Comment(val authorId: AccountId, val body: String)
```

The line is: if the string has a finite set of valid values or a specific format you parse/validate, model it; if it's arbitrary human text, `String` is correct.

## See Also

- [`anti-primitive-obsession`](anti-primitive-obsession.md) - the numeric counterpart to this same problem
- [`type-value-class-wrapper`](type-value-class-wrapper.md) - the zero-overhead way to wrap a `String` ID
- [`type-sealed-class-hierarchy`](type-sealed-class-hierarchy.md) - model a closed set of states instead of string constants
- [`type-data-class-value`](type-data-class-value.md) - the general rule of modeling data with real types
