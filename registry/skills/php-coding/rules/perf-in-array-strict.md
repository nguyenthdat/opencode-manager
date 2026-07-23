# perf-in-array-strict

> Use `in_array()` with `strict=true` for type safety

## Why It Matters

`in_array()` without strict comparison uses loose `==` comparison, which can produce unexpected matches (e.g., `0 == 'string'` is true in PHP). Always use the third parameter `true` for strict `===` comparison.

## Bad

```php
<?php

declare(strict_types=1);

$values = [1, 2, 3];

// Loose comparison — unexpected matches
$found = in_array('1', $values);    // true (coerced)
$found = in_array(0, $values);      // false — but in other arrays could match
$found = in_array(null, [0, '']);   // true! null == 0 and null == ''

// In a search feature
$needle = $_GET['id']; // '1abc'
$found = in_array($needle, $allowedIds); // true if $allowedIds has 1!
```

## Good

```php
<?php

declare(strict_types=1);

$values = [1, 2, 3];

// Strict comparison — only exact matches
$found = in_array('1', $values, true);  // false (int vs string)
$found = in_array(1, $values, true);    // true

// Safer with typed arrays
$found = in_array((int) $_GET['id'], $allowedIds, true);

// Even better — use enums or hash maps for O(1) lookup
$allowedIds = [1 => true, 2 => true, 3 => true];
$found = isset($allowedIds[(int) $_GET['id']]);
```

## See Also

- [type-strict-types](./type-strict-types.md)
- [type-array-shape-phpdoc](./type-array-shape-phpdoc.md)
