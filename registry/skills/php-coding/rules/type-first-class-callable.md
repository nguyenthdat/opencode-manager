# type-first-class-callable

> Use first-class callable syntax over Closure

## Why It Matters

First-class callable syntax (PHP 8.1+) creates closures from existing functions/methods without `Closure::fromCallable()`. The `strlen(...)` syntax is more readable, better for static analysis, and avoids the `$this->method` string-based approach.

## Bad

```php
<?php

declare(strict_types=1);

$len = \Closure::fromCallable('strlen');
$map = array_map([$this, 'transform'], $items);

$doubler = function (int $n): int {
    return $n * 2;
};
```

## Good

```php
<?php

declare(strict_types=1);

$len = strlen(...);
$map = array_map($this->transform(...), $items);

$doubler = fn(int $n): int => $n * 2;
$active = array_filter($users, fn(User $u): bool => $u->isActive());
```

## See Also

- [perf-array-map-filter](./perf-array-map-filter.md)
