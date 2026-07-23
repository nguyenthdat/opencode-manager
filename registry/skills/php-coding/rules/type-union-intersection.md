# type-union-intersection

> Use union types (`A|B`) and intersection types (`A&B`)

## Why It Matters

Union types (PHP 8.0+) allow a parameter to accept multiple types explicitly. Intersection types (PHP 8.1+) require a value to satisfy multiple contracts. Both improve type safety over `mixed` and enable precise static analysis.

## Bad

```php
<?php

declare(strict_types=1);

function formatValue(mixed $value): string {
    if (is_int($value)) return (string) $value;
    if (is_float($value)) return number_format($value, 2);
    throw new \InvalidArgumentException();
}

function formatInt(int $value): string {
    return (string) $value;
}
function formatFloat(float $value): string {
    return number_format($value, 2);
}
```

## Good

```php
<?php

declare(strict_types=1);

function formatValue(int|float $value): string {
    return is_int($value)
        ? (string) $value
        : number_format($value, 2);
}

class CountableIterator implements \Countable, \Iterator {}

function process(\Countable&\Iterator $collection): void {
    foreach ($collection as $item) {
        echo $item;
    }
    echo "Count: " . count($collection);
}
```

## See Also

- [type-nullable-explicit](./type-nullable-explicit.md)
- [type-avoid-mixed](./type-avoid-mixed.md)
