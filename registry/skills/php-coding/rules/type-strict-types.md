# type-strict-types

> Always use `declare(strict_types=1)`

## Why It Matters

Strict types prevent PHP's implicit type coercion, catching subtle bugs at runtime. Without strict types, PHP will silently convert types (e.g. `"1"` to `1`), leading to unexpected behavior. This is the single most impactful declaration for type safety.

## Bad

```php
<?php

// No strict types — implicit coercion
function add(int $a, int $b): int {
    return $a + $b;
}

echo add("5", "10"); // 15 — coercion hides the bug
```

## Good

```php
<?php

declare(strict_types=1);

function add(int $a, int $b): int {
    return $a + $b;
}

echo add("5", "10"); // TypeError: must be of type int, string given
```

## See Also

- [type-parameter-return](./type-parameter-return.md)
- [type-nullable-explicit](./type-nullable-explicit.md)
