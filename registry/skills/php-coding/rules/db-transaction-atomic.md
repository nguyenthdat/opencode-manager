# db-transaction-atomic

> Wrap multi-step writes in transactions

## Why It Matters

Transactions ensure all-or-nothing execution — either all writes succeed or none do. Without transactions, a failure halfway through a multi-step operation leaves the database in an inconsistent state. Use for any operation that modifies multiple rows across tables.

## Bad

```php
<?php

declare(strict_types=1);

class TransferService {
    public function transfer(int $fromId, int $toId, float $amount): void {
        $from = Account::find($fromId);
        $from->balance -= $amount;
        $from->save(); // Saved here

        // If this fails, $from is debited but $to never receives
        $to = Account::find($toId);
        $to->balance += $amount;
        $to->save();
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class TransferService {
    public function transfer(int $fromId, int $toId, float $amount): void {
        DB::transaction(function () use ($fromId, $toId, $amount) {
            $from = Account::lockForUpdate()->findOrFail($fromId);
            if ($from->balance < $amount) {
                throw new InsufficientFundsException();
            }

            $from->decrement('balance', $amount);
            Account::findOrFail($toId)->increment('balance', $amount);

            TransactionLog::create([
                'from_id' => $fromId, 'to_id' => $toId, 'amount' => $amount,
            ]);
        });
        // Automatic rollback on exception, commit on success
    }
}
```

## See Also

- [err-transaction-rollback](./err-transaction-rollback.md)
- [db-deadlock-retry](./db-deadlock-retry.md)
