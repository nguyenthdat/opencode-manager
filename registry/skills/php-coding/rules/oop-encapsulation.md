# oop-encapsulation

> Use private/protected; avoid public properties

## Why It Matters

Public properties expose internal state, breaking encapsulation. External code can mutate the object's state without its knowledge, making it impossible to maintain invariants. Use private properties with public methods that control access.

## Bad

```php
<?php

declare(strict_types=1);

class BankAccount {
    public string $accountNumber;
    public float $balance;
    public string $status;

    public function withdraw(float $amount): void { $this->balance -= $amount; }
}

$account = new BankAccount();
$account->balance = -999999; // Invalid state
```

## Good

```php
<?php

declare(strict_types=1);

class BankAccount {
    private float $balance;
    private string $status = 'active';

    public function __construct(
        public readonly string $accountNumber,
        float $initialDeposit,
    ) {
        if ($initialDeposit < 0) throw new \InvalidArgumentException();
        $this->balance = $initialDeposit;
    }

    public function getBalance(): float { return $this->balance; }

    public function withdraw(float $amount): void {
        if ($amount <= 0) throw new \InvalidArgumentException('Amount must be positive');
        if ($amount > $this->balance) throw new InsufficientFundsException($this->balance, $amount);
        if ($this->status !== 'active') throw new AccountNotActiveException($this->accountNumber);
        $this->balance -= $amount;
    }

    public function deposit(float $amount): void {
        if ($amount <= 0) throw new \InvalidArgumentException('Amount must be positive');
        $this->balance += $amount;
    }
}
```

## See Also

- [type-readonly-classes](./type-readonly-classes.md)
- [oop-value-objects](./oop-value-objects.md)
