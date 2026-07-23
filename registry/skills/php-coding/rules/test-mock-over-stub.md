# test-mock-over-stub

> Mock interfaces, not concrete classes when possible

## Why It Matters

Mocking interfaces decouples tests from concrete implementations. If you mock a concrete class, you're testing against implementation details that may change. Always type-hint interfaces and mock those instead.

## Bad

```php
<?php

declare(strict_types=1);

class PaymentService {
    public function __construct(private StripeGateway $gateway) {}

    public function charge(Order $order): void {
        $this->gateway->charge($order->total);
    }
}

// Test — mocking concrete class (fragile)
$mock = $this->createMock(StripeGateway::class);
$mock->expects($this->once())->method('charge');
// Test breaks if StripeGateway::charge() signature changes
```

## Good

```php
<?php

declare(strict_types=1);

interface PaymentGatewayInterface {
    public function charge(float $amount): PaymentResult;
}

class PaymentService {
    public function __construct(private PaymentGatewayInterface $gateway) {}

    public function charge(Order $order): PaymentResult {
        return $this->gateway->charge($order->total);
    }
}

// Test — mocking interface (stable)
$mock = $this->createMock(PaymentGatewayInterface::class);
$mock->expects($this->once())
    ->method('charge')
    ->with(100.0)
    ->willReturn(new PaymentResult('success'));

$service = new PaymentService($mock);
$result = $service->charge($order);

$this->assertSame('success', $result->status);
```

## See Also

- [di-contract-resolution](./di-contract-resolution.md)
- [oop-dependency-injection](./oop-dependency-injection.md)
