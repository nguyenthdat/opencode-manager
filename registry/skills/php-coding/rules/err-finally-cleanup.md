# err-finally-cleanup

> Use finally blocks for resource cleanup

## Why It Matters

`finally` guarantees cleanup runs regardless of whether the try block succeeds, throws, or returns. Use it for closing file handles, releasing locks, or other cleanup that must always happen.

## Bad

```php
<?php

declare(strict_types=1);

function processFile(string $path): string {
    $handle = fopen($path, 'r');
    $content = fread($handle, filesize($path));
    fclose($handle); // Not called if fread throws
    return $content;
}

function processWithLock(string $key): void {
    Cache::lock($key);
    doExpensiveWork();
    Cache::unlock($key); // Not called if doExpensiveWork throws
}
```

## Good

```php
<?php

declare(strict_types=1);

function processFile(string $path): string {
    $handle = fopen($path, 'r');
    try {
        return fread($handle, filesize($path));
    } finally {
        fclose($handle); // Always runs
    }
}

function processWithLock(string $key): void {
    Cache::lock($key);
    try {
        doExpensiveWork();
    } finally {
        Cache::unlock($key);
    }
}
```

## See Also

- [err-try-narrow-scope](./err-try-narrow-scope.md)
- [err-transaction-rollback](./err-transaction-rollback.md)
