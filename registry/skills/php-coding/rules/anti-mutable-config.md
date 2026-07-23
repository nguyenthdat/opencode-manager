# anti-mutable-config

> Don't mutate configuration at runtime

## Why It Matters

Mutating config at runtime creates behavior that differs from the config files, making debugging nearly impossible. If runtime values differ from config, use explicit parameters, a runtime context object, or feature flags — not config mutations.

## Bad

```php
<?php

declare(strict_types=1);

class PaymentService {
    public function process(Order $order): void {
        // Mutates global config — affects everything else
        config()->set('services.stripe.key', $order->merchantStripeKey);

        $stripe = new StripeClient(config('services.stripe.key'));
        $stripe->charge($order->total);

        // Other code now using a different Stripe key!
    }
}

function determineEnvironment(): void {
    if (isAdmin()) {
        config()->set('app.debug', true); // Security risk
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class PaymentService {
    public function process(Order $order): void {
        // Explicit parameter — no global mutation
        $stripe = new StripeClient($order->merchantStripeKey);
        $stripe->charge($order->total);
    }
}

// For environment-specific behavior — use feature flags
class FeatureFlags {
    public function __construct(private array $flags) {}

    public function isEnabled(string $feature): bool {
        return $this->flags[$feature] ?? false;
    }
}

$flags = new FeatureFlags(['beta_search' => $user->isBetaTester()]);

// Config is read-only — set at boot time, never mutated
// $config = new Config(require __DIR__ . '/config/app.php');
```

## See Also

- [anti-global-state](./anti-global-state.md)
- [di-config-injection](./di-config-injection.md)
