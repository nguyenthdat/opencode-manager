# type-named-arguments

> Use named arguments for clarity with 3+ params

## Why It Matters

Named arguments (PHP 8.0+) make function calls self-documenting and order-independent. They prevent bugs where positional arguments are swapped — especially critical for functions with multiple parameters of the same type.

## Bad

```php
<?php

declare(strict_types=1);

function createUser(
    string $name, string $email, string $role,
    bool $active = true, bool $verified = false,
): User { /* ... */ }

$user = createUser('John', 'john@example.com', 'admin', true, true);
```

## Good

```php
<?php

declare(strict_types=1);

function createUser(
    string $name, string $email, string $role,
    bool $active = true, bool $verified = false,
): User { /* ... */ }

$user = createUser(
    name: 'John',
    email: 'john@example.com',
    role: 'admin',
    verified: true,
    active: true,
);
```

## See Also

- [type-parameter-return](./type-parameter-return.md)
- [oop-builder-pattern](./oop-builder-pattern.md)
