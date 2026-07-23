# err-arrow-either-modeling

> Consider Arrow's `Either`/`Raise` for railway-oriented domain error handling

## Why It Matters

The stdlib `Result<T>` only carries a `Throwable` as its error type, which pushes you back toward exception hierarchies even when a plain data type (a validation error enum, a list of field errors) would be a better fit. Arrow's `Either<E, A>` lets `E` be any type you choose, and its `Raise` DSL (via `either { }` / `ensure` / `bind()`) lets you write straight-line code that reads like the happy path while errors short-circuit automatically underneath, a style known as "railway-oriented programming."

## Bad

```kotlin
sealed interface OrderError {
    data class InvalidQuantity(val qty: Int) : OrderError
    data class OutOfStock(val itemId: String) : OrderError
    data class PaymentDeclined(val reason: String) : OrderError
}

// Manual nested when-based error propagation gets deep fast
fun placeOrder(itemId: String, qty: Int): Any {
    val qtyCheck = if (qty <= 0) OrderError.InvalidQuantity(qty) else null
    if (qtyCheck != null) return qtyCheck
    val stockCheck = if (!inventory.hasStock(itemId, qty)) OrderError.OutOfStock(itemId) else null
    if (stockCheck != null) return stockCheck
    val paymentResult = payment.charge(itemId, qty)
    if (paymentResult == null) return OrderError.PaymentDeclined("card declined")
    return paymentResult
}
```

## Good

```kotlin
import arrow.core.raise.either
import arrow.core.raise.ensure

sealed interface OrderError {
    data class InvalidQuantity(val qty: Int) : OrderError
    data class OutOfStock(val itemId: String) : OrderError
    data class PaymentDeclined(val reason: String) : OrderError
}

fun placeOrder(itemId: String, qty: Int): Either<OrderError, Receipt> = either {
    ensure(qty > 0) { OrderError.InvalidQuantity(qty) }
    ensure(inventory.hasStock(itemId, qty)) { OrderError.OutOfStock(itemId) }
    val payment = payment.charge(itemId, qty) ?: raise(OrderError.PaymentDeclined("card declined"))
    Receipt(itemId, qty, payment)
}

fun handle(itemId: String, qty: Int) {
    placeOrder(itemId, qty).fold(
        ifLeft = { error -> showError(error) },
        ifRight = { receipt -> confirm(receipt) },
    )
}
```

## When It's Worth The Dependency

Arrow is worth adopting when a codebase has many chained, multi-step fallible domain operations across service boundaries; for a small app or a library that wants zero extra dependencies, stdlib `Result<T>` or a hand-rolled sealed type is often enough.

## See Also

- [`err-result-explicit-modeling`](err-result-explicit-modeling.md) - the sealed-type pattern Arrow's `Either` generalizes
- [`err-kotlin-result-inline`](err-kotlin-result-inline.md) - the lighter stdlib alternative
- [`type-sealed-class-hierarchy`](type-sealed-class-hierarchy.md) - the mechanism underlying custom error types used with `Either`
