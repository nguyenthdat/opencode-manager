# oop-value-objects

> Use immutable value objects with readonly properties

## Why It Matters

Value objects model concepts by their value, not identity. They are immutable — methods return new instances instead of mutating. This prevents aliasing bugs and makes them safe to share. Use `readonly class` (PHP 8.2+) for clean immutability.

## Bad

```php
<?php

declare(strict_types=1);

class Money {
    public function __construct(public float $amount, public string $currency) {}
    public function add(float $amount): void { $this->amount += $amount; }
}

$price = new Money(10.0, 'USD');
$tax = $price;
$tax->add(2.0); // Now $price is also 12.0!
```

## Good

```php
<?php

declare(strict_types=1);

readonly class Money {
    public function __construct(public int $amount, public string $currency) {
        if ($amount < 0) throw new \InvalidArgumentException();
    }

    public function add(Money $other): self {
        $this->assertSameCurrency($other);
        return new self($this->amount + $other->amount, $this->currency);
    }

    public function format(): string {
        return number_format($this->amount / 100, 2) . ' ' . $this->currency;
    }

    public function equals(Money $other): bool {
        return $this->amount === $other->amount && $this->currency === $other->currency;
    }

    private function assertSameCurrency(Money $other): void {
        if ($this->currency !== $other->currency) {
            throw new CurrencyMismatchException($this->currency, $other->currency);
        }
    }
}
```

## See Also

- [type-readonly-classes](./type-readonly-classes.md)
- [oop-dto-data-transfer](./oop-dto-data-transfer.md)
