# anti-silent-error-swallow

> Don't use `try {} catch (\Throwable $e) {}` empty

## Why It Matters

Empty catch blocks hide all errors — data corruption, security breaches, and logic bugs go unnoticed. If you catch an exception, you must handle it (log, rethrow, or recover with intent). An empty catch is a guaranteed production incident.

## Bad

```php
<?php

declare(strict_types=1);

// Silent swallow — everything is ignored
try {
    $user = User::find($id);
    $user->update($data);
} catch (\Throwable $e) {
    // Nothing — user not found? update failed? who knows
}

try {
    $payment = PaymentService::charge($order);
} catch (\Throwable $e) {
    // Payment failed but nobody knows — data corrupted
}
```

## Good

```php
<?php

declare(strict_types=1);

try {
    $user = User::find($id);
    $user->update($data);
} catch (UserNotFoundException $e) {
    logger()->warning('User not found', ['user_id' => $id]);
    throw $e; // Let caller handle
} catch (ValidationException $e) {
    logger()->info('Validation failed', ['user_id' => $id, 'errors' => $e->getErrors()]);
    throw $e;
}

// Graceful degradation with logging
try {
    $payment = PaymentService::charge($order);
} catch (PaymentFailedException $e) {
    logger()->error('Payment failed', [
        'order_id' => $order->id, 'amount' => $order->total, 'error' => $e->getMessage(),
    ]);
    return redirect()->back()->withErrors(['payment' => 'Payment failed. Please try again.']);
}
```

## See Also

- [err-no-empty-catch](./err-no-empty-catch.md)
- [err-exception-context](./err-exception-context.md)
