# doc-generics-phpstan

> Use `@template`/`@extends` for generic type documentation

## Why It Matters

PHP lacks native generics, but PHPDoc `@template` annotations enable PHPStan/Psalm to track types through generic classes. This provides type safety for collections, repositories, and other generic patterns.

## Bad

```php
<?php

declare(strict_types=1);

class Collection {
    private array $items = [];

    public function add($item): void { $this->items[] = $item; }
    public function first() { return $this->items[0] ?? null; }
}

$users = new Collection();
$users->add(new User());
$user = $users->first(); // Type: mixed — no autocomplete on User methods
```

## Good

```php
<?php

declare(strict_types=1);

/**
 * @template T
 */
class Collection {
    /** @var array<int, T> */
    private array $items = [];

    /** @param T $item */
    public function add(mixed $item): void {
        $this->items[] = $item;
    }

    /** @return T|null */
    public function first(): mixed {
        return $this->items[0] ?? null;
    }
}

/** @param Collection<User> $users */
function processUsers(Collection $users): void {
    $user = $users->first(); // Type: User|null — full autocomplete
    $user?->getName(); // PHPStan knows this is a User method
}

// For extending generic classes
/**
 * @template T of Model
 * @extends Collection<T>
 */
class ModelCollection extends Collection {
    /** @return T|null */
    public function fresh(): mixed { /* ... */ }
}
```

## See Also

- [doc-phpdoc-public](./doc-phpdoc-public.md)
- [type-array-shape-phpdoc](./type-array-shape-phpdoc.md)
