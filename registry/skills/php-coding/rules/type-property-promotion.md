# type-property-promotion

> Use constructor property promotion

## Why It Matters

Constructor property promotion (PHP 8.0+) reduces boilerplate by declaring and assigning properties in a single constructor parameter. It eliminates the repetitive pattern of declaring a property, adding a constructor parameter, and assigning it.

## Bad

```php
<?php

declare(strict_types=1);

class Product {
    private string $name;
    private float $price;
    private int $stock;
    private ?string $description;

    public function __construct(
        string $name, float $price, int $stock, ?string $description = null
    ) {
        $this->name = $name;
        $this->price = $price;
        $this->stock = $stock;
        $this->description = $description;
    }
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
        private int $stock,
        private ?string $description = null,
    ) {}

    public function getName(): string { return $this->name; }
    public function getPrice(): float { return $this->price; }
}
```

## See Also

- [oop-encapsulation](./oop-encapsulation.md)
- [type-readonly-classes](./type-readonly-classes.md)
