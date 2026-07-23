# oop-strategy-pattern

> Use strategy pattern for swappable algorithms

## Why It Matters

The strategy pattern encapsulates interchangeable algorithms behind a common interface, letting you swap behavior at runtime. It eliminates conditional logic (if/switch) that selects between algorithms, making code open for extension but closed for modification.

## Bad

```php
<?php

declare(strict_types=1);

class ShippingCalculator {
    public function calculate(Order $order, string $method): float {
        if ($method === 'standard') return $order->weight * 5.0;
        elseif ($method === 'express') return $order->weight * 12.0 + 15.0;
        elseif ($method === 'overnight') return $order->weight * 25.0 + 30.0;
        throw new \InvalidArgumentException();
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

interface ShippingStrategy {
    public function calculate(Order $order): float;
    public function name(): string;
}

class StandardShipping implements ShippingStrategy {
    public function calculate(Order $order): float { return $order->weight * 5.0; }
    public function name(): string { return 'Standard'; }
}

class ExpressShipping implements ShippingStrategy {
    public function calculate(Order $order): float { return $order->weight * 12.0 + 15.0; }
    public function name(): string { return 'Express'; }
}

class ShippingCalculator {
    public function __construct(private ShippingStrategy $strategy) {}
    public function calculate(Order $order): float { return $this->strategy->calculate($order); }
}

$calculator = new ShippingCalculator(match ($user->preference) {
    'fast' => new ExpressShipping(),
    default => new StandardShipping(),
});
```

## See Also

- [oop-interface-segregation](./oop-interface-segregation.md)
- [oop-dependency-injection](./oop-dependency-injection.md)
