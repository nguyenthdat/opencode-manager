# err-custom-exception

> Create domain-specific exception classes

## Why It Matters

Generic exceptions (`RuntimeException`, `IllegalArgumentException`) don't communicate business meaning. Domain-specific exceptions make error handling explicit at the API level, enable targeted catch blocks, and produce meaningful log messages that speed up debugging.

## Bad

```groovy
class OrderService {
    def placeOrder(Order order) {
        if (order.items.isEmpty()) {
            throw new RuntimeException("No items")      // What kind of error?
        }
        if (!inventoryService.checkStock(order)) {
            throw new IllegalStateException("No stock")  // Should be a domain error
        }
    }
}

try {
    orderService.placeOrder(order)
} catch (RuntimeException e) {
    // Is this a validation error? Stock error? Payment error?
    showError(e.message)
}
```

## Good

```groovy
class OrderException extends Exception {
    OrderException(String message) { super(message) }
    OrderException(String message, Throwable cause) { super(message, cause) }
}

class EmptyOrderException extends OrderException {
    EmptyOrderException() { super('Order must contain at least one item') }
}

class InsufficientStockException extends OrderException {
    String productCode
    int requested, available

    InsufficientStockException(String productCode, int requested, int available) {
        super("Insufficient stock for $productCode: requested $requested, available $available")
        this.productCode = productCode
        this.requested = requested
        this.available = available
    }
}

class OrderService {
    def placeOrder(Order order) throws OrderException {
        if (order.items.isEmpty()) throw new EmptyOrderException()
        if (!inventoryService.checkStock(order)) {
            def shortage = inventoryService.findShortage(order)
            throw new InsufficientStockException(
                shortage.productCode, shortage.requested, shortage.available
            )
        }
    }
}

try {
    orderService.placeOrder(order)
} catch (EmptyOrderException e) {
    showUserMessage('Please add items to your order')
} catch (InsufficientStockException e) {
    showUserMessage("Only ${e.available} units of ${e.productCode} available")
} catch (OrderException e) {
    log.error('Unexpected order error', e)
    showUserMessage('Something went wrong')
}
```

## See Also

- [err-catch-specific](err-catch-specific.md) - Catch specific exceptions
- [err-avoid-checked-to-unchecked](err-avoid-checked-to-unchecked.md) - Don't silence checked exceptions
- [err-no-bare-throw](err-no-bare-throw.md) - Always throw with context
