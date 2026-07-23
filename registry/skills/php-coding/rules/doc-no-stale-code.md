# doc-no-stale-code

> Remove commented-out code

## Why It Matters

Commented-out code rots — it's unclear if it's still relevant, and it adds cognitive load when reading. Version control preserves deleted code history. If code is worth keeping, it's worth having in a branch or referenced via a commit hash.

## Bad

```php
<?php

declare(strict_types=1);

class OrderService {
    public function process(Order $order): void {
        // Old validation — removed March 2024
        // if ($order->total <= 0) {
        //     throw new \Exception('Invalid total');
        // }

        $this->validate($order);

        // Previous payment method:
        // $result = Paypal::charge($order);
        // $result = Stripe::charge($order);

        $result = $this->gateway->charge($order);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class OrderService {
    public function process(Order $order): void {
        // Validate order before processing
        $this->validate($order);

        // Process payment through the configured gateway
        $result = $this->gateway->charge($order);
    }
}

// Deleted code is in git history:
// git log -p -- src/OrderService.php
// Shows: Stripe::charge was replaced by GatewayInterface in commit abc123
```

## See Also

- [doc-inline-why](./doc-inline-why.md)
- [proj-gitignore-standard](./proj-gitignore-standard.md)
