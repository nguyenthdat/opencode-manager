# lint-property-type

> Require property type declarations

## Why It Matters

Typed properties prevent invalid assignments and serve as documentation. PHP 7.4+ supports property types. PHPStan/Psalm can enforce that all properties have type declarations. Uninitialized typed properties cause runtime errors — a feature, not a bug.

## Bad

```php
<?php

declare(strict_types=1);

class User {
    private $name;
    private $email;
    private $status;
    private $createdAt;

    public function __construct(string $name, string $email) {
        $this->name = $name;
        $this->email = $email;
        // Forgot to set $status and $createdAt
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class User {
    private string $name;
    private string $email;
    private string $status = 'active';
    private \DateTimeImmutable $createdAt;

    public function __construct(string $name, string $email) {
        $this->name = $name;
        $this->email = $email;
        $this->createdAt = new \DateTimeImmutable();
        // PHPStan catches uninitialized properties
    }
}

// phpstan.neon — require property types
parameters:
    level: 8
    checkMissingPropertyTypehint: true
```

## See Also

- [lint-return-type](./lint-return-type.md)
- [type-parameter-return](./type-parameter-return.md)
