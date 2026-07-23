# doc-phpdoc-public

> Write PHPDoc for all public API elements

## Why It Matters

PHPDoc blocks on public methods, properties, and classes serve as API documentation. They describe intent, parameter types, return types, and edge cases. Static analyzers (PHPStan/Psalm) also use them for type inference.

## Bad

```php
<?php

declare(strict_types=1);

class PaymentGateway {
    public function charge(float $amount, string $currency, array $metadata): PaymentResult {
        // No docs — what currencies are valid? What metadata is expected?
    }

    public function refund(string $transactionId): bool {
        // Does this throw? What does false mean?
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class PaymentGateway {
    /**
     * Charges a payment through the configured payment processor.
     *
     * @param float $amount The amount to charge in the smallest currency unit (e.g., cents)
     * @param string $currency ISO 4217 currency code (e.g., 'USD', 'EUR')
     * @param array{description?: string, receipt_email?: string} $metadata
     * @return PaymentResult The payment result with transaction ID and status
     * @throws PaymentFailedException When the payment processor declines the charge
     * @throws InvalidCurrencyException When the currency is not supported
     */
    public function charge(float $amount, string $currency, array $metadata = []): PaymentResult {
        // ...
    }

    /**
     * Refunds a previously processed payment.
     *
     * @param string $transactionId The payment transaction ID
     * @return RefundResult
     * @throws RefundFailedException When the refund cannot be processed
     * @throws TransactionNotFoundException When the transaction does not exist
     */
    public function refund(string $transactionId): RefundResult {
        // ...
    }
}
```

## See Also

- [doc-param-return](./doc-param-return.md)
- [doc-throws-tag](./doc-throws-tag.md)
