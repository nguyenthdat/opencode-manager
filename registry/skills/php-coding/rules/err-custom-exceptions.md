# err-custom-exceptions

> Create domain-specific exception classes

## Why It Matters

Domain-specific exceptions let callers catch exactly the errors they can handle. They carry meaningful context (e.g., validation errors with field names). Avoid generic `\RuntimeException` or `\Exception` — they provide no semantic meaning.

## Bad

```php
<?php

declare(strict_types=1);

class PaymentService {
    public function process(Order $order): void {
        if ($order->total <= 0) throw new \InvalidArgumentException('Invalid total');
        if (!$this->gateway->charge($order)) throw new \RuntimeException('Payment failed');
    }
}

try { $service->process($order); } catch (\Throwable $e) { log_error($e); }
```

## Good

```php
<?php

declare(strict_types=1);

class PaymentFailedException extends \RuntimeException {
    public function __construct(
        public readonly string $transactionId,
        public readonly string $reason,
        ?\Throwable $previous = null,
    ) {
        parent::__construct("Payment {$transactionId} failed: {$reason}", 0, $previous);
    }
}

class PaymentService {
    public function process(Order $order): void {
        try {
            $result = $this->gateway->charge($order);
        } catch (GatewayException $e) {
            throw new PaymentFailedException($order->id, $e->getMessage(), previous: $e);
        }
    }
}
```

## See Also

- [err-throw-exceptions](./err-throw-exceptions.md)
- [err-catch-specific](./err-catch-specific.md)
