# name-controller-suffix

> Suffix controllers with Controller

## Why It Matters

The `Controller` suffix clearly identifies HTTP request handlers. It distinguishes controllers from services, models, and other classes. This is standard in Laravel, Symfony, and most PHP frameworks.

## Bad

```php
<?php

declare(strict_types=1);

// Ambiguous — what kind of class is this?
class User {}
class Order {}
class Dashboard {}

class UserHandler {}
class OrderManager {}
```

## Good

```php
<?php

declare(strict_types=1);

class UserController {}
class OrderController {}
class DashboardController {}

// Single-action controllers
class ShowUserController {
    public function __invoke(int $id): Response { /* ... */ }
}

// Resource controller methods
class OrderController {
    public function index(): View {}
    public function store(StoreOrderRequest $request): RedirectResponse {}
    public function show(int $id): View {}
    public function update(UpdateOrderRequest $request, int $id): RedirectResponse {}
    public function destroy(int $id): RedirectResponse {}
}
```

## See Also

- [name-exception-suffix](./name-exception-suffix.md)
- [proj-action-pattern](./proj-action-pattern.md)
