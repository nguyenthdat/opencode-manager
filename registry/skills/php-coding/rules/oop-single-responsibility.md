# oop-single-responsibility

> One reason to change per class

## Why It Matters

A class with multiple responsibilities couples unrelated concerns, making changes risky and testing difficult. Each class should have one reason to change — one job. This is the foundation of maintainable OOP.

## Bad

```php
<?php

declare(strict_types=1);

class OrderProcessor {
    public function process(Order $order): void {
        if ($order->total <= 0) throw new \Exception();
        $tax = $order->total * $this->getTaxRate($order->state);
        Stripe::charge($order->total + $tax, $order->token);
        mail($order->email, 'Order Confirmed', $this->buildEmail($order));
        foreach ($order->items as $item) {
            Inventory::decrement($item->productId, $item->quantity);
        }
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class OrderProcessor {
    public function __construct(
        private OrderValidator $validator,
        private TaxCalculator $taxCalculator,
        private PaymentGateway $gateway,
        private EmailNotifier $notifier,
        private InventoryManager $inventory,
    ) {}

    public function process(Order $order): void {
        $this->validator->validate($order);
        $tax = $this->taxCalculator->calculate($order);
        $this->gateway->charge($order->total + $tax, $order->token);
        $this->notifier->sendConfirmation($order);
        $this->inventory->decrement($order->items);
    }
}
```

## See Also

- [oop-interface-segregation](./oop-interface-segregation.md)
- [oop-dependency-injection](./oop-dependency-injection.md)
