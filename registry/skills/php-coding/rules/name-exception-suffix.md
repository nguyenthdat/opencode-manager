# name-exception-suffix

> Suffix exception classes with Exception

## Why It Matters

The `Exception` suffix clearly identifies error types, making exception handling code self-documenting. It distinguishes exception classes from regular classes with similar names (e.g., `PaymentException` vs `Payment`).

## Bad

```php
<?php

declare(strict_types=1);

class OrderNotFound extends \RuntimeException {}
class PaymentFailed extends \RuntimeException {}
class ValidationError extends \InvalidArgumentException {}
class Unauthorized extends \RuntimeException {}

throw new OrderNotFound(); // Is this an exception?
```

## Good

```php
<?php

declare(strict_types=1);

class OrderNotFoundException extends \RuntimeException {}
class PaymentFailedException extends \RuntimeException {}
class ValidationException extends \InvalidArgumentException {}
class UnauthorizedException extends \RuntimeException {}

throw new OrderNotFoundException(); // Clearly an exception

class OrderNotFoundException extends \RuntimeException {
    public static function forId(int $id): self {
        return new self("Order #{$id} not found");
    }
}
```

## See Also

- [name-controller-suffix](./name-controller-suffix.md)
- [err-custom-exceptions](./err-custom-exceptions.md)
