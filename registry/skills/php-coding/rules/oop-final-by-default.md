# oop-final-by-default

> Make classes final by default; open for extension via interfaces

## Why It Matters

Final classes prevent uncontrolled inheritance, which is the primary source of the fragile base class problem. Design classes to be used (via public API) or extended (via interfaces), not both.

## Bad

```php
<?php

declare(strict_types=1);

class PaymentProcessor {
    protected float $fee = 0.03;
    public function process(Payment $payment): PaymentResult {
        $amount = $payment->amount * (1 + $this->fee);
        return $this->charge($amount);
    }
    protected function charge(float $amount): PaymentResult { /* ... */ }
}

class NoFeeProcessor extends PaymentProcessor {
    protected float $fee = 0.0; // Overrides internal state — fragile
}
```

## Good

```php
<?php

declare(strict_types=1);

interface PaymentProcessor {
    public function process(Payment $payment): PaymentResult;
    public function getFee(): float;
}

final class StandardPaymentProcessor implements PaymentProcessor {
    public function __construct(private float $fee = 0.03) {}
    public function process(Payment $payment): PaymentResult {
        $amount = $payment->amount * (1 + $this->fee);
        return $this->charge($amount);
    }
    public function getFee(): float { return $this->fee; }
    private function charge(float $amount): PaymentResult { /* ... */ }
}

final class NoFeeProcessor implements PaymentProcessor {
    public function process(Payment $payment): PaymentResult { return $this->charge($payment->amount); }
    public function getFee(): float { return 0.0; }
}
```

## See Also

- [oop-interface-segregation](./oop-interface-segregation.md)
- [oop-single-responsibility](./oop-single-responsibility.md)
