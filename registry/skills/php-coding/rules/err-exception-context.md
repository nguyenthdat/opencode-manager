# err-exception-context

> Include context data in exceptions

## Why It Matters

Exceptions without context force developers to reproduce the error to debug it. Include relevant IDs, input data, and state in exception messages or properties. This dramatically speeds up debugging from logs alone.

## Bad

```php
<?php

declare(strict_types=1);

class OrderProcessor {
    public function process(int $orderId): void {
        $order = Order::find($orderId);
        if (!$order) throw new \RuntimeException('Order not found');
        if ($order->total < 0) throw new \RuntimeException('Invalid order total');
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class InvalidOrderException extends \DomainException {
    public function __construct(
        string $message,
        public readonly array $context = [],
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }
}

class OrderProcessor {
    public function process(int $orderId): void {
        $order = Order::find($orderId);
        if (!$order) {
            throw OrderNotFoundException::forId($orderId);
        }
        if ($order->total < 0) {
            throw new InvalidOrderException(
                message: "Order #{$orderId} has negative total",
                context: ['order_id' => $orderId, 'total' => $order->total, 'customer_id' => $order->customerId],
            );
        }
    }
}
```

## See Also

- [err-custom-exceptions](./err-custom-exceptions.md)
- [err-chained-exceptions](./err-chained-exceptions.md)
