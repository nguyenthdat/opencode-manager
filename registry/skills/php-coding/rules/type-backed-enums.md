# type-backed-enums

> Use backed enums (string/int) for database/API values

## Why It Matters

Backed enums map enum cases to scalar values (string or int), making them ideal for database columns, API responses, and form inputs. Use `->value` to get the scalar and `Enum::from()` or `Enum::tryFrom()` to create from scalars.

## Bad

```php
<?php

declare(strict_types=1);

class PaymentMethod {
    public const CREDIT_CARD = 'credit_card';
    public const PAYPAL = 'paypal';
    public const BANK_TRANSFER = 'bank_transfer';
}

function processPayment(string $method): void {
    if (!in_array($method, ['credit_card', 'paypal', 'bank_transfer'])) {
        throw new \InvalidArgumentException();
    }
}

$db->insert('payments', ['method' => 'credit_card']);
```

## Good

```php
<?php

declare(strict_types=1);

enum PaymentMethod: string {
    case CreditCard = 'credit_card';
    case PayPal = 'paypal';
    case BankTransfer = 'bank_transfer';

    public function providerClass(): string {
        return match ($this) {
            self::CreditCard => StripeProvider::class,
            self::PayPal => PayPalProvider::class,
            self::BankTransfer => BankProvider::class,
        };
    }
}

function processPayment(PaymentMethod $method): void {
    $provider = $method->providerClass();
}

$db->insert('payments', ['method' => PaymentMethod::CreditCard->value]);
$method = PaymentMethod::from($row['method']);
```

## See Also

- [type-enums-over-constants](./type-enums-over-constants.md)
- [name-enums-singular](./name-enums-singular.md)
