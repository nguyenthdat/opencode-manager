# anti-static-coupling

> Don't use static methods for stateful logic

## Why It Matters

Static methods can't be mocked, can't have state injected, and create tight coupling. Use static methods only for pure, stateless utility functions (e.g., `Str::slug()`, math helpers). For anything that accesses data or external services, use instance methods with DI.

## Bad

```php
<?php

declare(strict_types=1);

class OrderProcessor {
    public static function process(Order $order): void {
        // Static — can't mock anything
        $rate = ExchangeRate::getCurrent('USD');
        $order->totalUsd = $order->total * $rate;
        EmailService::sendConfirmation($order);
        InventoryService::decrement($order->items);
        AuditLogger::record('order_processed', $order->id);
    }
}

// Called statically — all dependencies are hidden
OrderProcessor::process($order);
```

## Good

```php
<?php

declare(strict_types=1);

class OrderProcessor {
    public function __construct(
        private ExchangeRateService $exchangeRate,
        private EmailService $email,
        private InventoryManager $inventory,
        private AuditLogger $logger,
    ) {}

    public function process(Order $order): void {
        $rate = $this->exchangeRate->getCurrent('USD');
        $order->totalUsd = $order->total * $rate;
        $this->email->sendConfirmation($order);
        $this->inventory->decrement($order->items);
        $this->logger->record('order_processed', $order->id);
    }
}

// Stateless utility — static is fine
final class MathUtils {
    public static function clamp(int $value, int $min, int $max): int {
        return max($min, min($max, $value));
    }
}
```

## See Also

- [anti-global-state](./anti-global-state.md)
- [anti-singleton-misuse](./anti-singleton-misuse.md)
