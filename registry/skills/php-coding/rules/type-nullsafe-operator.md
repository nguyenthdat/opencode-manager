# type-nullsafe-operator

> Use `?->` operator over repetitive null checks

## Why It Matters

The nullsafe operator (PHP 8.0+) short-circuits to null if the left side is null, eliminating chains of `if ($x !== null)` checks. It makes code more readable and reduces the risk of missing a null check in a chain.

## Bad

```php
<?php

declare(strict_types=1);

function getCountry(User $user): ?string {
    if ($user->getProfile() !== null) {
        if ($user->getProfile()->getAddress() !== null) {
            return $user->getProfile()->getAddress()->getCountry();
        }
    }
    return null;
}
```

## Good

```php
<?php

declare(strict_types=1);

function getCountry(User $user): ?string {
    return $user->getProfile()?->getAddress()?->getCountry();
}

$country = $user->getProfile()?->getAddress()?->getCountry() ?? 'Unknown';
```

## See Also

- [type-nullable-explicit](./type-nullable-explicit.md)
- [oop-null-object](./oop-null-object.md)
