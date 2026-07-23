# db-no-model-in-view

> Don't pass Eloquent models directly to views; use DTOs

## Why It Matters

Passing Eloquent models to views couples the presentation layer to the ORM. Views can trigger lazy loading (N+1), accidentally access protected attributes, or call database methods. Use DTOs or dedicated view models to define exactly what data the view needs.

## Bad

```php
<?php

declare(strict_types=1);

class OrderController {
    public function show(int $id): View {
        $order = Order::findOrFail($id);

        return view('orders.show', ['order' => $order]);
    }
}

// In blade template — can trigger lazy loading, access relations
{{ $order->customer->name }}  // Lazy load customer
{{ $order->items()->sum('price') }} // DB query from view
{{ $order->secret_field }} // Accidentally exposed
```

## Good

```php
<?php

declare(strict_types=1);

readonly class OrderViewDto {
    public function __construct(
        public int $id,
        public string $customerName,
        public string $status,
        public float $total,
        public string $createdAt,
        /** @var OrderItemViewDto[] */
        public array $items,
    ) {}
}

class OrderController {
    public function show(int $id): View {
        $order = Order::with(['customer', 'items'])->findOrFail($id);
        $dto = new OrderViewDto(
            id: $order->id,
            customerName: $order->customer->name,
            status: $order->status->label(),
            total: $order->total,
            createdAt: $order->created_at->format('M d, Y'),
            items: $order->items->map(fn($i) => new OrderItemViewDto(
                name: $i->product_name,
                quantity: $i->quantity,
                price: $i->price,
            ))->all(),
        );
        return view('orders.show', ['order' => $dto]);
    }
}
```

## See Also

- [oop-dto-data-transfer](./oop-dto-data-transfer.md)
- [db-eager-loading](./db-eager-loading.md)
