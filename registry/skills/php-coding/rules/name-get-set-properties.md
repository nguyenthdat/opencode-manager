# name-get-set-properties

> Use getXxx/setXxx for property accessors

## Why It Matters

Get/set prefix convention for accessors is standard in PHP and enables automatic discovery by serializers, ORMs, and IDEs. It clearly distinguishes data access from behavior methods.

## Bad

```php
<?php

declare(strict_types=1);

class Product {
    private string $name;
    private float $price;

    public function name(): string { return $this->name; }
    public function price(): float { return $this->price; }
    public function changeName(string $name): void { $this->name = $name; }
    public function updatePrice(float $price): void { $this->price = $price; }
}
```

## Good

```php
<?php

declare(strict_types=1);

class Product {
    public function __construct(
        private string $name,
        private float $price,
    ) {}

    public function getName(): string { return $this->name; }
    public function getPrice(): float { return $this->price; }
    public function setName(string $name): void { $this->name = $name; }
    public function setPrice(float $price): void { $this->price = $price; }
}
```

## See Also

- [name-is-has-boolean](./name-is-has-boolean.md)
- [name-method-verb-object](./name-method-verb-object.md)
