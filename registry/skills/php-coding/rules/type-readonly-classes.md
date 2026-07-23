# type-readonly-classes

> Use readonly classes (PHP 8.2+) for immutable objects

## Why It Matters

Readonly classes enforce immutability at the language level, preventing accidental property mutation after construction. This is essential for value objects, DTOs, and any data that should not change. Immutability simplifies reasoning about code.

## Bad

```php
<?php

declare(strict_types=1);

class Address {
    private string $street;
    private string $city;
    private string $zip;

    public function __construct(string $street, string $city, string $zip) {
        $this->street = $street;
        $this->city = $city;
        $this->zip = $zip;
    }

    public function getStreet(): string { return $this->street; }
    public function getCity(): string { return $this->city; }
    public function getZip(): string { return $this->zip; }

    public function setStreet(string $street): void {
        $this->street = $street;
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

readonly class Address {
    public function __construct(
        public string $street,
        public string $city,
        public string $zip,
    ) {}

    public function withStreet(string $street): self {
        return new self($street, $this->city, $this->zip);
    }
}
```

## See Also

- [oop-value-objects](./oop-value-objects.md)
- [oop-dto-data-transfer](./oop-dto-data-transfer.md)
