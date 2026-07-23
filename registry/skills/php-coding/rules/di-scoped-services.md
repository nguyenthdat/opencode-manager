# di-scoped-services

> Bind scoped services for request lifecycle

## Why It Matters

Some services should be created per request (e.g., services holding request-specific state) rather than as singletons. Scoped bindings ensure a fresh instance per request/scope, preventing state leaking between requests.

## Bad

```php
<?php

declare(strict_types=1);

class CartService {
    private array $items = [];
    public function addItem(Product $product): void { $this->items[] = $product; }
}

// Singleton — items persist across requests
$this->app->singleton(CartService::class);
```

## Good

```php
<?php

declare(strict_types=1);

class CartService {
    private array $items = [];
    public function addItem(Product $product): void { $this->items[] = $product; }
}

// Scoped — fresh instance per request
$this->app->scoped(CartService::class);

// Or explicit binding
$this->app->bind(CartService::class, fn($app) => new CartService());
```

## See Also

- [di-container-binding](./di-container-binding.md)
- [anti-singleton-misuse](./anti-singleton-misuse.md)
