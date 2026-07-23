# err-try-narrow-scope

> Keep try blocks small and focused

## Why It Matters

Large try blocks catch exceptions from code that shouldn't be caught, obscuring the source of errors. Each try block should wrap only the lines that can throw the specific exception you're handling.

## Bad

```php
<?php

declare(strict_types=1);

function importOrders(string $filename): void {
    try {
        $content = file_get_contents($filename);
        $rows = array_map('str_getcsv', explode("\n", $content));
        $header = array_shift($rows);
        $count = 0;
        foreach ($rows as $row) {
            $data = array_combine($header, $row);
            $order = Order::create($data);
            $order->dispatch();
            $count++;
        }
        logger()->info("Imported {$count} orders");
    } catch (\Exception $e) {
        logger()->error('Import failed');
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

function importOrders(string $filename): void {
    try {
        $content = file_get_contents($filename);
    } catch (\RuntimeException $e) {
        throw new FileReadException($filename, previous: $e);
    }

    $rows = array_map('str_getcsv', explode("\n", $content));
    $header = array_shift($rows);
    $count = 0;

    foreach ($rows as $row) {
        $data = array_combine($header, $row);
        try {
            $order = Order::create($data);
            $order->dispatch();
        } catch (\PDOException $e) {
            logger()->error('DB error importing row', ['row' => $row]);
            continue;
        } catch (QueueException $e) {
            logger()->warning('Queue dispatch failed', ['order_id' => $order->id]);
        }
        $count++;
    }
    logger()->info("Imported {$count} orders");
}
```

## See Also

- [err-catch-specific](./err-catch-specific.md)
- [err-finally-cleanup](./err-finally-cleanup.md)
