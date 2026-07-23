# di-tagged-services

> Use tagged services for collections of implementations

## Why It Matters

Tagged services allow you to register multiple implementations under a common tag and inject them as a collection. This is ideal for plugin systems, event listeners, or any scenario where you want to iterate over all implementations of an interface.

## Bad

```php
<?php

declare(strict_types=1);

class PaymentGateway {
    private array $processors = [];

    public function __construct() {
        $this->processors = [
            new StripeProcessor(),
            new PayPalProcessor(),
            new BankTransferProcessor(),
        ];
    }

    public function process(Payment $payment): void {
        foreach ($this->processors as $p) {
            if ($p->supports($payment->method)) { $p->process($payment); return; }
        }
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class PaymentServiceProvider extends ServiceProvider {
    public function register(): void {
        $this->app->tag([StripeProcessor::class], 'payment.processors');
        $this->app->tag([PayPalProcessor::class], 'payment.processors');
        $this->app->tag([BankTransferProcessor::class], 'payment.processors');
    }
}

class PaymentGateway {
    /** @param PaymentProcessor[] $processors */
    public function __construct(
        #[TaggedIterator('payment.processors')]
        private iterable $processors,
    ) {}

    public function process(Payment $payment): void {
        foreach ($this->processors as $p) {
            if ($p->supports($payment->method)) { $p->process($payment); return; }
        }
        throw new UnsupportedPaymentMethodException($payment->method);
    }
}
```

## See Also

- [di-container-binding](./di-container-binding.md)
- [oop-strategy-pattern](./oop-strategy-pattern.md)
