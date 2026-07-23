# type-match-over-switch

> Use match expression over switch for exhaustive matching

## Why It Matters

`match` (PHP 8.0+) is an expression that returns a value, requires no `break`, and throws an error for unhandled cases. Unlike `switch`, it enforces exhaustiveness and eliminates fall-through bugs.

## Bad

```php
<?php

declare(strict_types=1);

function getStatusLabel(string $status): string {
    switch ($status) {
        case 'active':
            $label = 'Active';
            break;
        case 'inactive':
            $label = 'Inactive';
            break;
        case 'suspended':
            $label = 'Suspended';
            break;
        default:
            $label = 'Unknown';
            break;
    }
    return $label;
}
```

## Good

```php
<?php

declare(strict_types=1);

enum Status: string {
    case Active = 'active';
    case Inactive = 'inactive';
    case Suspended = 'suspended';
}

function getStatusLabel(Status $status): string {
    return match ($status) {
        Status::Active => 'Active',
        Status::Inactive => 'Inactive',
        Status::Suspended => 'Suspended',
    };
}

$access = match (true) {
    $user->isAdmin() => 'full',
    $user->isModerator() => 'moderate',
    default => 'read',
};
```

## See Also

- [type-enums-over-constants](./type-enums-over-constants.md)
