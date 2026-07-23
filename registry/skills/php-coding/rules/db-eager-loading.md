# db-eager-loading

> Eager load relationships to avoid N+1

## Why It Matters

The N+1 problem occurs when you load N records and then execute 1 additional query per record to fetch a relationship. Eager loading (`with()`) fetches relationships in bulk, reducing N+1 queries to 2. This is critical for any list endpoint.

## Bad

```php
<?php

declare(strict_types=1);

class OrderController {
    public function index(): JsonResponse {
        $orders = Order::all(); // 1 query for orders

        $result = [];
        foreach ($orders as $order) {
            $result[] = [
                'id' => $order->id,
                'user' => $order->user->name,       // N queries!
                'items' => $order->items->toArray(), // N queries!
            ];
        }
        // Total: 1 + N + N queries
        return response()->json($result);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class OrderController {
    public function index(): JsonResponse {
        $orders = Order::with(['user', 'items'])->get(); // 3 queries total

        $result = [];
        foreach ($orders as $order) {
            $result[] = [
                'id' => $order->id,
                'user' => $order->user->name,       // Already loaded
                'items' => $order->items->toArray(), // Already loaded
            ];
        }
        return response()->json($result);
    }
}

// Prevent N+1 in development
Model::preventLazyLoading(!app()->isProduction());

// Select only needed columns from relationships
Order::with(['user:id,name', 'items:id,order_id,product_name'])->get();
```

## See Also

- [db-select-specific](./db-select-specific.md)
- [db-index-strategy](./db-index-strategy.md)
