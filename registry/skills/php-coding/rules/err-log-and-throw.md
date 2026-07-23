# err-log-and-throw

> Log before throwing when appropriate

## Why It Matters

Logging before throwing ensures the error is captured at the point of occurrence with full local context. If the exception is caught and handled higher up without logging, the root cause is still recorded.

## Bad

```php
<?php

declare(strict_types=1);

class PaymentProcessor {
    public function charge(Order $order): PaymentResult {
        try {
            return $this->gateway->charge($order);
        } catch (GatewayException $e) {
            throw new PaymentFailedException(orderId: $order->id, previous: $e);
        }
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class PaymentProcessor {
    public function charge(Order $order): PaymentResult {
        try {
            return $this->gateway->charge($order);
        } catch (GatewayException $e) {
            logger()->error('Payment gateway failed', [
                'order_id' => $order->id, 'amount' => $order->total,
                'gateway_error' => $e->getMessage(), 'gateway_code' => $e->getCode(),
            ]);
            throw new PaymentFailedException(orderId: $order->id, previous: $e);
        }
    }
}
```

## See Also

- [err-exception-context](./err-exception-context.md)
- [err-chained-exceptions](./err-chained-exceptions.md)
