# proj-action-pattern

> Use single-action controllers or invokable classes

## Why It Matters

Single-action controllers (classes with `__invoke()`) keep controllers focused on one action. They're ideal for complex endpoints that don't fit resource patterns. Each class is a single, testable unit.

## Bad

```php
<?php

declare(strict_types=1);

class OrderController {
    // 20 methods — hard to navigate, high cognitive load
    public function create() {}
    public function store(Request $r) {}
    public function show(int $id) {}
    public function edit(int $id) {}
    public function update(Request $r, int $id) {}
    public function destroy(int $id) {}
    public function confirm(int $id) {}
    public function cancel(int $id) {}
    public function refund(int $id) {}
    public function export() {}
    public function import(Request $r) {}
    // ... 10 more methods
}
```

## Good

```php
<?php

declare(strict_types=1);

// Resource controller — only CRUD operations
class OrderController {
    public function index() {}
    public function store(StoreOrderRequest $request) {}
    public function show(Order $order) {}
    public function update(UpdateOrderRequest $request, Order $order) {}
    public function destroy(Order $order) {}
}

// Single-action controllers for complex endpoints
class ConfirmOrderController {
    public function __invoke(Order $order): RedirectResponse {
        $this->authorize('confirm', $order);
        app(OrderConfirmationService::class)->confirm($order);
        return redirect()->route('orders.show', $order);
    }
}

class ExportOrdersController {
    public function __invoke(Request $request): BinaryFileResponse {
        $orders = app(OrderExportService::class)->export($request->dateRange());
        return response()->download($orders);
    }
}
```

## See Also

- [proj-service-layer](./proj-service-layer.md)
- [name-controller-suffix](./name-controller-suffix.md)
