# perf-references-large

> Pass large arrays/objects by reference when mutating

## Why It Matters

Passing large arrays or objects by value creates a copy, consuming memory and CPU. Use `&` references when you need to mutate large structures inside a function. Objects are passed by reference (handle) by default — but arrays are copied.

## Bad

```php
<?php

declare(strict_types=1);

// Copies the entire array — memory intensive for large datasets
function transform(array $data): array {
    foreach ($data as &$row) {
        $row['processed'] = true;
    }
    return $data; // Returns another copy
}

$largeData = fetchLargeDataset(); // Assume 10K+ rows
$largeData = transform($largeData); // Two copies in memory
```

## Good

```php
<?php

declare(strict_types=1);

// Pass by reference — no copy, modifies in place
function transform(array &$data): void {
    foreach ($data as &$row) {
        $row['processed'] = true;
    }
    unset($row); // Important: unset reference after loop
}

$largeData = fetchLargeDataset();
transform($largeData); // Same array, mutated in place

// Use generators for even larger datasets
function fetchAndTransform(): Generator {
    foreach (fetchLargeDatasetCursor() as $row) {
        $row['processed'] = true;
        yield $row;
    }
}
```

## See Also

- [perf-generator-yield](./perf-generator-yield.md)
- [perf-array-over-object](./perf-array-over-object.md)
