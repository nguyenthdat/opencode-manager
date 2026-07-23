# perf-array-map-filter

> Use `array_map`/`array_filter` over foreach for transformations

## Why It Matters

Array functions are implemented in C and are faster than PHP-level foreach loops for simple transformations. They also communicate intent more clearly — `array_map` means 'transform', `array_filter` means 'select subset'.

## Bad

```php
<?php

declare(strict_types=1);

$users = getUsers();
$names = [];
foreach ($users as $user) {
    $names[] = $user->name;
}

$active = [];
foreach ($users as $user) {
    if ($user->isActive()) {
        $active[] = $user;
    }
}

$transformed = [];
foreach ($users as $user) {
    $transformed[] = strtoupper($user->name);
}
```

## Good

```php
<?php

declare(strict_types=1);

$users = getUsers();

$names = array_map(fn(User $u): string => $u->name, $users);
$active = array_filter($users, fn(User $u): bool => $u->isActive());

// Combine map + filter (with keys preserved)
$activeNames = array_map(
    fn(User $u): string => $u->name,
    array_filter($users, fn(User $u): bool => $u->isActive()),
);

// For complex operations, foreach is still fine — use with explicit intent
$result = [];
foreach ($chunkedData as $batch) {
    $result[] = $this->processBatch($batch); // Complex logic — foreach is clearer
}
```

## See Also

- [type-first-class-callable](./type-first-class-callable.md)
- [perf-generator-yield](./perf-generator-yield.md)
