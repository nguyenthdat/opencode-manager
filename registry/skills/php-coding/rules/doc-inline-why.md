# doc-inline-why

> Comment WHY not WHAT

## Why It Matters

Code should be self-documenting for what it does (through good naming). Comments should explain why — the business logic, edge cases, and non-obvious decisions. Comments that restate the code are noise.

## Bad

```php
<?php

declare(strict_types=1);

class PricingService {
    public function calculateDiscount(Order $order): float {
        // Multiply the total by 0.1
        $discount = $order->total * 0.1;

        // Return 0 if discount is greater than 100
        if ($discount > 100) {
            return 0;
        }

        // Return the discount
        return $discount;
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class PricingService {
    public function calculateDiscount(Order $order): float {
        // Loyalty discount: 10% off, capped at $100 per regulatory requirement §2.4
        $discount = $order->total * 0.1;

        if ($discount > 100.0) {
            return 0; // No discount above $100 limit — regulatory cap
        }

        return $discount;
    }

    public function isEligibleForPromo(User $user): bool {
        // Workaround: Session-based cart doesn't sync with user table until checkout
        // See: https://github.com/company/project/issues/1234
        return $user->created_at->diffInDays(now()) > 30
            && !$user->orders()->where('status', 'refunded')->exists();
    }
}
```

## See Also

- [doc-phpdoc-public](./doc-phpdoc-public.md)
- [doc-no-stale-code](./doc-no-stale-code.md)
