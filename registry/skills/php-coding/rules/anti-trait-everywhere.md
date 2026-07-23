# anti-trait-everywhere

> Don't overuse traits as replacement for composition

## Why It Matters

Traits are for horizontal code reuse, not for avoiding proper class design. Overused traits create implicit dependencies, name collisions, and classes whose full API is scattered across multiple files. Prefer composition (injecting objects) when possible.

## Bad

```php
<?php

declare(strict_types=1);

class Order {
    use LogsActivity;
    use HasTimestamps;
    use SoftDeletes;
    use GeneratesInvoice;
    use SendsNotifications;
    use TracksHistory;
    use HasValidation;
    use ManagesCache;
    // 8 traits — what's the actual API of Order?
}
```

## Good

```php
<?php

declare(strict_types=1);

class Order {
    use HasTimestamps; // Simple data concern — trait is fine
    use SoftDeletes;   // Simple data concern — trait is fine

    public function __construct(
        private InvoiceService $invoiceService,    // Composition
        private NotificationService $notifications, // Composition
        private ActivityLogger $logger,            // Composition
        private CacheManager $cache,               // Composition
    ) {}

    public function finalize(): void {
        $this->invoiceService->generate($this);
        $this->notifications->sendOrderConfirmation($this);
        $this->logger->log('order_finalized', ['id' => $this->id]);
    }
}

// Trait checklist:
// 1. Does it have no dependencies on the class state? -> trait OK
// 2. Does it need injected services? -> composition
// 3. Is it shared across unrelated classes? -> trait OK
// 4. Could it be a standalone service? -> composition
```

## See Also

- [oop-composition-over-inheritance](./oop-composition-over-inheritance.md)
- [oop-trait-over-abstract](./oop-trait-over-abstract.md)
