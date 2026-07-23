# type-avoid-mixed

> Avoid `mixed` type; use specific types or generics via PHPDoc

## Why It Matters

The `mixed` type tells static analyzers nothing about the value, disabling type checking. Use union types, array shapes, or PHPDoc generics instead. `mixed` is appropriate only in very generic utility code (e.g., a cache wrapper).

## Bad

```php
<?php

declare(strict_types=1);

class Config {
    public function get(string $key): mixed {
        return $this->items[$key] ?? null;
    }

    public function set(string $key, mixed $value): void {
        $this->items[$key] = $value;
    }
}

$timeout = $config->get('timeout'); // What type is this?
```

## Good

```php
<?php

declare(strict_types=1);

class TypedConfig {
    private array $items = [];

    public function getString(string $key, ?string $default = null): ?string {
        $value = $this->items[$key] ?? $default;
        return is_string($value) ? $value : $default;
    }

    public function getInt(string $key, ?int $default = null): ?int {
        $value = $this->items[$key] ?? $default;
        return is_int($value) ? $value : $default;
    }

    public function getBool(string $key, ?bool $default = null): ?bool {
        $value = $this->items[$key] ?? $default;
        return is_bool($value) ? $value : $default;
    }
}
```

## See Also

- [type-union-intersection](./type-union-intersection.md)
- [type-array-shape-phpdoc](./type-array-shape-phpdoc.md)
