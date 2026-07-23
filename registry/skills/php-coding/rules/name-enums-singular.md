# name-enums-singular

> Enum names singular; cases UPPER_SNAKE

## Why It Matters

Enums represent a single type — use singular names. Cases use PascalCase for pure enums and UPPER_SNAKE_CASE for backed enums (matching the database/API value convention). This is consistent with PHP's native enum naming.

## Bad

```php
<?php

declare(strict_types=1);

// Plural — wrong
enum OrderStatuses: string {
    case Pending = 'pending';
    case Processing = 'processing';
}

// Inconsistent case naming
enum UserRole: string {
    case admin = 'admin';
    case MODERATOR = 'moderator';
    case superAdmin = 'super_admin';
}
```

## Good

```php
<?php

declare(strict_types=1);

// Singular
enum OrderStatus: string {
    case Pending = 'pending';
    case Processing = 'processing';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
}

// Pure enum — PascalCase
enum Direction {
    case North;
    case South;
    case East;
    case West;
}

// Backed enum — PascalCase cases
enum UserRole: string {
    case Admin = 'admin';
    case Moderator = 'moderator';
    case Member = 'member';
}
```

## See Also

- [type-enums-over-constants](./type-enums-over-constants.md)
- [name-constants-UPPER_SNAKE](./name-constants-UPPER_SNAKE.md)
