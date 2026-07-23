# type-enums-over-constants

> Use Enums (PHP 8.1+) over class constants

## Why It Matters

Native PHP enums provide type safety, exhaustive matching, and methods. Unlike class constants, enums prevent invalid values at the type level. They can hold data (backed enums) and behavior (methods), making them far more powerful.

## Bad

```php
<?php

declare(strict_types=1);

class OrderStatus {
    public const PENDING = 'pending';
    public const PROCESSING = 'processing';
    public const SHIPPED = 'shipped';
    public const DELIVERED = 'delivered';
    public const CANCELLED = 'cancelled';
}

function handleStatus(string $status): void {
    match ($status) {
        OrderStatus::PENDING => process(),
        default => throw new \InvalidArgumentException(),
    };
}
```

## Good

```php
<?php

declare(strict_types=1);

enum OrderStatus: string {
    case Pending = 'pending';
    case Processing = 'processing';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';

    public function label(): string {
        return match ($this) {
            self::Pending => 'Pending',
            self::Processing => 'Processing',
            self::Shipped => 'Shipped',
            self::Delivered => 'Delivered',
            self::Cancelled => 'Cancelled',
        };
    }

    public function isFinal(): bool {
        return in_array($this, [self::Delivered, self::Cancelled], true);
    }
}

function handleStatus(OrderStatus $status): void {
    match ($status) {
        OrderStatus::Pending => process(),
        OrderStatus::Processing => process(),
        OrderStatus::Shipped => ship(),
        OrderStatus::Delivered,
        OrderStatus::Cancelled => finalize(),
    };
}
```

## See Also

- [type-backed-enums](./type-backed-enums.md)
- [name-enums-singular](./name-enums-singular.md)
