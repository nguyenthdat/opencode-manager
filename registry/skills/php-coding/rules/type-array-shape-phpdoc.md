# type-array-shape-phpdoc

> Use `@phpstan-type` and array shapes in PHPDoc

## Why It Matters

PHP arrays are untyped — array shapes provide static analysis with precise type information for array keys and values. Define reusable types with `@phpstan-type` to document expected array structures throughout your codebase.

## Bad

```php
<?php

declare(strict_types=1);

class OrderService {
    /** @param array $data */
    public function create(array $data): array {
        $data['total'] = $data['price'] * $data['quantity'];
        return $data;
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

/**
 * @phpstan-type OrderData = array{
 *     product_id: int,
 *     quantity: int,
 *     price: float,
 *     customer_email?: string,
 * }
 * @phpstan-type OrderResult = array{
 *     product_id: int,
 *     quantity: int,
 *     price: float,
 *     total: float,
 *     created_at: string,
 * }
 */
class OrderService {
    /** @param OrderData $data */
    public function create(array $data): array {
        $data['total'] = $data['price'] * $data['quantity'];
        $data['created_at'] = date('c');
        return $data;
    }
}
```

## See Also

- [type-parameter-return](./type-parameter-return.md)
- [type-avoid-mixed](./type-avoid-mixed.md)
