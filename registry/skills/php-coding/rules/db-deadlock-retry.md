# db-deadlock-retry

> Implement retry logic for deadlock errors

## Why It Matters

Deadlocks can occur when concurrent transactions lock resources in different orders. The database resolves them by killing one transaction. Implement automatic retry — the killed transaction should re-attempt a few times with backoff.

## Bad

```php
<?php

declare(strict_types=1);

class InventoryService {
    public function reserve(int $productId, int $quantity): void {
        DB::transaction(function () use ($productId, $quantity) {
            $product = Product::lockForUpdate()->find($productId);
            if ($product->stock < $quantity) throw new OutOfStockException();
            $product->decrement('stock', $quantity);
        });
        // Deadlock? Transaction fails — no retry
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class InventoryService {
    public function reserve(int $productId, int $quantity): void {
        $this->executeWithDeadlockRetry(function () use ($productId, $quantity) {
            DB::transaction(function () use ($productId, $quantity) {
                $product = Product::lockForUpdate()->findOrFail($productId);
                if ($product->stock < $quantity) throw new OutOfStockException();
                $product->decrement('stock', $quantity);
            });
        });
    }

    private function executeWithDeadlockRetry(callable $callback, int $maxRetries = 3): mixed {
        $attempt = 0;
        while (true) {
            try {
                return $callback();
            } catch (\PDOException $e) {
                if ($e->getCode() !== '40001' || $attempt >= $maxRetries) {
                    throw $e;
                }
                $attempt++;
                logger()->warning("Deadlock retry {$attempt}/{$maxRetries}");
                usleep(random_int(100000, 500000)); // 100-500ms backoff
            }
        }
    }
}
```

## See Also

- [db-transaction-atomic](./db-transaction-atomic.md)
- [async-retry-exponential](./async-retry-exponential.md)
