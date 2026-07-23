# perf-generator-yield

> Use generators (`yield`) for large datasets

## Why It Matters

Generators produce values one at a time without building the entire array in memory. For processing large datasets (CSV parsing, DB exports, batch operations), generators can mean the difference between running out of memory and constant memory usage.

## Bad

```php
<?php

declare(strict_types=1);

// Loads entire file into memory
function readCsv(string $path): array {
    $rows = [];
    $handle = fopen($path, 'r');
    while (($row = fgetcsv($handle)) !== false) {
        $rows[] = $row; // Accumulates all rows in memory
    }
    fclose($handle);
    return $rows;
}

// 1GB CSV = 1GB+ memory usage
$rows = readCsv('large.csv');
foreach ($rows as $row) {
    process($row);
}
```

## Good

```php
<?php

declare(strict_types=1);

// Generator — yields one row at a time, constant memory
function readCsv(string $path): Generator {
    $handle = fopen($path, 'r');
    try {
        while (($row = fgetcsv($handle)) !== false) {
            yield $row; // Only one row in memory at a time
        }
    } finally {
        fclose($handle);
    }
}

// Same 1GB CSV = minimal memory usage
foreach (readCsv('large.csv') as $row) {
    process($row);
}

// Chunked DB processing
function getLargeResultSet(): Generator {
    $stmt = DB::query('SELECT * FROM orders');
    while ($row = $stmt->fetch()) {
        yield $row;
    }
}
```

## See Also

- [perf-references-large](./perf-references-large.md)
- [db-chunk-processing](./db-chunk-processing.md)
