# err-catch-specific

> Catch specific exception types, not `\Throwable`

## Why It Matters

Catching `\Throwable` or `\Exception` catches everything including programming errors (TypeError, ParseError) that should not be caught. Catch only the specific exceptions you can meaningfully handle at that level.

## Bad

```php
<?php

declare(strict_types=1);

function processOrder(int $orderId): void {
    try {
        $order = Order::find($orderId);
        InvoiceService::generate($order);
        EmailService::send($order->email, $invoice);
    } catch (\Throwable $e) {
        logger()->error('Order processing failed', ['error' => $e->getMessage()]);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

function processOrder(int $orderId): void {
    try {
        $order = Order::find($orderId);
        InvoiceService::generate($order);
        EmailService::send($order->email, $invoice);
    } catch (OrderNotFoundException $e) {
        logger()->warning('Order not found', ['order_id' => $orderId]);
        throw $e;
    } catch (InvoiceGenerationException $e) {
        logger()->error('Invoice generation failed', ['order_id' => $orderId]);
    } catch (EmailSendException $e) {
        logger()->error('Email failed, but order is processed', ['order_id' => $orderId]);
    }
}
```

## See Also

- [err-custom-exceptions](./err-custom-exceptions.md)
- [err-throwable-vs-exception](./err-throwable-vs-exception.md)
