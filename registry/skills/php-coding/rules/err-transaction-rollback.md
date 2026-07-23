# err-transaction-rollback

> Roll back transactions on exception

## Why It Matters

Database transactions must be rolled back if an exception occurs mid-operation. Without rollback, partial data is committed, corrupting your database. Always wrap multi-step DB operations in transactions with rollback in the catch block.

## Bad

```php
<?php

declare(strict_types=1);

function transferFunds(int $fromId, int $toId, float $amount): void {
    DB::beginTransaction();
    $from = Account::find($fromId);
    $from->balance -= $amount;
    $from->save();
    $to = Account::find($toId);
    $to->balance += $amount;
    $to->save();
    DB::commit(); // Exception before commit? Transaction hangs
}
```

## Good

```php
<?php

declare(strict_types=1);

function transferFunds(int $fromId, int $toId, float $amount): void {
    DB::beginTransaction();
    try {
        $from = Account::lockForUpdate()->find($fromId);
        if ($from->balance < $amount) {
            throw new InsufficientFundsException($fromId, $amount, $from->balance);
        }
        $from->balance -= $amount;
        $from->save();
        $to = Account::lockForUpdate()->find($toId);
        $to->balance += $amount;
        $to->save();
        DB::commit();
    } catch (\Throwable $e) {
        DB::rollBack();
        logger()->error('Transfer failed, rolled back', [
            'from_id' => $fromId, 'to_id' => $toId, 'amount' => $amount, 'error' => $e->getMessage(),
        ]);
        throw $e;
    }
}
```

## See Also

- [db-transaction-atomic](./db-transaction-atomic.md)
- [err-finally-cleanup](./err-finally-cleanup.md)
