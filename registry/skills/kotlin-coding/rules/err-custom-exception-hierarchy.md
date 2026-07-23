# err-custom-exception-hierarchy

> Build a custom sealed exception hierarchy for domain errors

## Why It Matters

Throwing generic `RuntimeException` or a grab-bag of unrelated exception types forces every catch site to inspect messages or do brittle string matching to figure out what actually went wrong. A sealed exception hierarchy rooted in your domain lets callers catch a specific, meaningful failure type, and lets a `when` over the caught exception be exhaustively checked just like any other sealed type.

## Bad

```kotlin
fun placeOrder(order: Order) {
    if (order.items.isEmpty()) {
        throw RuntimeException("empty order")
    }
    if (!inventory.hasStock(order)) {
        throw RuntimeException("insufficient stock: ${order.id}")
    }
    if (!payment.charge(order)) {
        throw RuntimeException("payment failed")
    }
}

fun handleOrder(order: Order) {
    try {
        placeOrder(order)
    } catch (e: RuntimeException) {
        // Must parse e.message to know what actually happened - fragile
        if (e.message?.contains("stock") == true) restockAlert()
    }
}
```

## Good

```kotlin
sealed class OrderException(message: String, cause: Throwable? = null) : Exception(message, cause) {
    class EmptyOrder(val orderId: String) : OrderException("Order $orderId has no items")
    class InsufficientStock(val orderId: String, val itemId: String) :
        OrderException("Item $itemId unavailable for order $orderId")
    class PaymentFailed(val orderId: String, cause: Throwable) :
        OrderException("Payment failed for order $orderId", cause)
}

fun placeOrder(order: Order) {
    if (order.items.isEmpty()) throw OrderException.EmptyOrder(order.id)
    if (!inventory.hasStock(order)) {
        throw OrderException.InsufficientStock(order.id, order.items.first().id)
    }
    payment.charge(order).onFailure { throw OrderException.PaymentFailed(order.id, it) }
}

fun handleOrder(order: Order) {
    try {
        placeOrder(order)
    } catch (e: OrderException.InsufficientStock) {
        restockAlert(e.itemId)
    } catch (e: OrderException.PaymentFailed) {
        retryPayment(e.orderId)
    } catch (e: OrderException) {
        logger.error("Order ${e.message}", e)
    }
}
```

## See Also

- [`err-cause-chaining`](err-cause-chaining.md) - preserving the original failure inside custom exceptions
- [`err-no-catch-generic-exception`](err-no-catch-generic-exception.md) - why catching by specific type matters
- [`type-sealed-class-hierarchy`](type-sealed-class-hierarchy.md) - the general pattern this hierarchy is built on
- [`err-result-explicit-modeling`](err-result-explicit-modeling.md) - non-exception alternative for expected failures
