# lint-method-complexity

> Limit cyclomatic complexity

## Why It Matters

High cyclomatic complexity (many if/switch/loop branches) makes methods hard to understand, test, and modify. Set a complexity limit (e.g., 10) in PHPStan/Psalm. Exceeding it forces decomposition into smaller methods.

## Bad

```php
<?php

declare(strict_types=1);

class ShippingCalculator {
    public function calculate(Order $order, string $method): float {
        $cost = 0;
        if ($order->weight < 1) {
            if ($method === 'standard') {
                $cost = 5.0;
            } elseif ($method === 'express') {
                $cost = 10.0;
            } else {
                $cost = 20.0;
            }
        } else if ($order->weight < 5) {
            if ($order->destination === 'domestic') {
                if ($method === 'standard') { $cost = 8.0; }
                else { $cost = 15.0; }
            } else {
                if ($method === 'standard') { $cost = 20.0; }
                else if ($method === 'express') { $cost = 35.0; }
                else { $cost = 50.0; }
            }
        } else {
            if ($order->destination === 'domestic') { $cost = 12.0; }
            else { $cost = 40.0; }
        }
        if ($order->isGift) { $cost += 3.0; }
        if ($order->needsInsurance) { $cost += 5.0; }
        return $cost;
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class ShippingCalculator {
    private const WEIGHT_RATES = [
        'light' => ['standard' => 5.0, 'express' => 10.0, 'overnight' => 20.0],
        'medium_domestic' => ['standard' => 8.0, 'express' => 15.0],
        'medium_intl' => ['standard' => 20.0, 'express' => 35.0, 'overnight' => 50.0],
        'heavy_domestic' => ['standard' => 12.0],
        'heavy_intl' => ['standard' => 40.0],
    ];

    public function calculate(Order $order, ShippingStrategy $strategy): float {
        $cost = $strategy->calculate($order);
        $cost += $this->calculateExtras($order);
        return $cost;
    }

    private function calculateExtras(Order $order): float {
        return match (true) {
            $order->isGift && $order->needsInsurance => 8.0,
            $order->isGift => 3.0,
            $order->needsInsurance => 5.0,
            default => 0.0,
        };
    }
}

// phpstan.neon — enforce limit
parameters:
    level: 8
    paths:
        - src
    reportUnmatchedIgnoredErrors: false

// Tool: phpmnd for method complexity
// vendor/bin/phpmnd src/
// phploc src/ — reports complexity per file
```

## See Also

- [oop-single-responsibility](./oop-single-responsibility.md)
- [oop-strategy-pattern](./oop-strategy-pattern.md)
