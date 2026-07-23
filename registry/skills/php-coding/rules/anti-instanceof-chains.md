# anti-instanceof-chains

> Don't chain instanceof checks; use polymorphism

## Why It Matters

Long `if/else instanceof` chains violate the Open-Closed Principle — adding a new type requires modifying every chain. Use polymorphism: each class implements a common interface method. The type system handles dispatch automatically.

## Bad

```php
<?php

declare(strict_types=1);

class ShippingCalculator {
    public function calculate(object $shippable): float {
        if ($shippable instanceof StandardPackage) {
            return $shippable->weight * 5.0;
        } elseif ($shippable instanceof ExpressPackage) {
            return $shippable->weight * 12.0 + 15.0;
        } elseif ($shippable instanceof OversizedPackage) {
            return $shippable->weight * 25.0 + $shippable->extraFee();
        } elseif ($shippable instanceof FragilePackage) {
            return $shippable->weight * 20.0 + 10.0;
        }
        throw new \InvalidArgumentException();
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

interface Shippable {
    public function shippingCost(): float;
}

class StandardPackage implements Shippable {
    public function __construct(private float $weight) {}
    public function shippingCost(): float { return $this->weight * 5.0; }
}

class ExpressPackage implements Shippable {
    public function __construct(private float $weight) {}
    public function shippingCost(): float { return $this->weight * 12.0 + 15.0; }
}

class ShippingCalculator {
    public function calculate(Shippable $item): float {
        return $item->shippingCost(); // Polymorphism — no instanceof
    }
}

// Adding a new type — create a class, no existing code changes
class FragilePackage implements Shippable {
    public function __construct(private float $weight) {}
    public function shippingCost(): float { return $this->weight * 20.0 + 10.0; }
}
```

## See Also

- [oop-strategy-pattern](./oop-strategy-pattern.md)
- [type-match-over-switch](./type-match-over-switch.md)
