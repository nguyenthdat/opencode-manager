# test-exception-expect

> Use `expectException()` for exception testing

## Why It Matters

`expectException()` clearly documents that a test expects an exception. It verifies the exception type, message, and code. Place it before the act phase so it's obvious what the test expects to happen.

## Bad

```php
<?php

declare(strict_types=1);

class PaymentTest extends TestCase {
    public function testCharge_NegativeAmount_Fails(): void {
        try {
            PaymentService::charge(-50.0);
            $this->fail('Expected exception was not thrown');
        } catch (InvalidAmountException $e) {
            $this->assertSame('Amount must be positive', $e->getMessage());
        }
    }

    // Expecting exception but none thrown — test passes incorrectly
    public function testCharge_ZeroAmount(): void {
        PaymentService::charge(0.0); // No assertion
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class PaymentTest extends TestCase {
    public function testCharge_NegativeAmount_ThrowsInvalidAmountException(): void {
        $this->expectException(InvalidAmountException::class);
        $this->expectExceptionMessage('Amount must be positive');
        $this->expectExceptionCode(400);

        PaymentService::charge(-50.0);
    }

    // For testing exception and its context
    public function testCharge_InsufficientFunds_ThrowsWithContext(): void {
        $this->expectException(InsufficientFundsException::class);
        $this->expectExceptionMessageMatches('/insufficient funds/i');

        try {
            PaymentService::charge(500.0); // Balance is 100.0
        } catch (InsufficientFundsException $e) {
            $this->assertSame(100.0, $e->available);
            $this->assertSame(500.0, $e->requested);
            throw $e;
        }
    }
}
```

## See Also

- [test-arrange-act-assert](./test-arrange-act-assert.md)
- [err-custom-exceptions](./err-custom-exceptions.md)
