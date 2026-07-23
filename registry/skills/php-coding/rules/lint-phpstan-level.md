# lint-phpstan-level

> Run PHPStan at level 8+ (or Psalm equivalent)

## Why It Matters

PHPStan analyzes code without running it, finding bugs before they reach production. Level 0 is basic; level 8 checks array shapes and union types. Level 9 (max) adds strict comparison. Aim for level 8+ — it catches the most impactful bugs.

## Bad

```php
<?php

// No static analysis — bugs found in production
function processOrder(int $orderId): void {
    $order = Order::find($orderId);
    echo $order->total; // What if $order is null?
    $order->send();     // Does Order have a send() method?
}

// Level 0-2 — only basic checks
```

## Good

```php
<?php

// phpstan.neon
parameters:
    level: 8
    paths:
        - src
    bootstrapFiles:
        - vendor/phpstan/phpstan/bootstrap.php
    ignoreErrors:
        - '#Unsafe usage of new static#'
    checkMissingIterableValueType: true
    checkGenericClassInNonGenericObjectType: true

// Level 8 catches:
// - Calling method on possibly null
// - Array shape mismatches
// - Union type precision
// - Missing return types

// Run in CI
// vendor/bin/phpstan analyse --memory-limit=256M

// Psalm alternative
// vendor/bin/psalm --show-info=true
```

## See Also

- [lint-strict-rules](./lint-strict-rules.md)
- [lint-native-type-hints](./lint-native-type-hints.md)
