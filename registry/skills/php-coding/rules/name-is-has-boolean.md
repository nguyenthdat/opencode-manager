# name-is-has-boolean

> Prefix boolean methods with is/has/should/can

## Why It Matters

Boolean methods prefixed with `is`, `has`, `should`, or `can` read naturally in conditionals. `if ($user->isActive())` reads like English. This is a widely adopted convention that improves code readability.

## Bad

```php
<?php

declare(strict_types=1);

class Order {
    public function paid(): bool { return $this->status === 'paid'; }
    public function shipped(): bool { return $this->status === 'shipped'; }
    public function cancelable(): bool { return $this->status === 'pending'; }
    public function authorized(string $permission): bool { /* ... */ }
}

if ($order->paid()) {}
if ($order->authorized('delete')) {}
```

## Good

```php
<?php

declare(strict_types=1);

class Order {
    public function isPaid(): bool { return $this->status === 'paid'; }
    public function isShipped(): bool { return $this->status === 'shipped'; }
    public function canCancel(): bool { return $this->status === 'pending'; }
    public function hasPermission(string $permission): bool { /* ... */ }
    public function shouldNotify(): bool { /* ... */ }
}

if ($order->isPaid()) {}
if ($order->hasPermission('delete')) {}
```

## See Also

- [name-method-verb-object](./name-method-verb-object.md)
- [name-methods-vars-camelCase](./name-methods-vars-camelCase.md)
