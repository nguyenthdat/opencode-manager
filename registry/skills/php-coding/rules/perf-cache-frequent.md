# perf-cache-frequent

> Cache expensive computations and DB queries

## Why It Matters

Caching prevents redundant work — DB queries, API calls, and CPU-intensive computations. Use Redis/Memcached for distributed caching or APCu for local. Cache at the right granularity: not too fine (cache overhead dominates) nor too coarse (low hit rate).

## Bad

```php
<?php

declare(strict_types=1);

class DashboardController {
    public function index(): View {
        // Queries run on every request
        $totalUsers = User::count();
        $totalOrders = Order::count();
        $revenue = Order::where('status', 'completed')->sum('total');
        $topProducts = Product::withCount('orders')
            ->orderByDesc('orders_count')
            ->limit(10)
            ->get();

        return view('dashboard', compact('totalUsers', 'totalOrders', 'revenue', 'topProducts'));
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class DashboardController {
    public function index(): View {
        $stats = Cache::remember('dashboard:stats', 300, function () {
            return [
                'totalUsers' => User::count(),
                'totalOrders' => Order::count(),
                'revenue' => Order::where('status', 'completed')->sum('total'),
                'topProducts' => Product::withCount('orders')
                    ->orderByDesc('orders_count')->limit(10)->get(),
            ];
        });

        return view('dashboard', $stats);
    }

    // Invalidate cache when data changes
    public function onOrderCreated(Order $order): void {
        Cache::forget('dashboard:stats');
    }
}

// Event-based invalidation
class OrderObserver {
    public function created(Order $order): void { Cache::forget('dashboard:stats'); }
    public function updated(Order $order): void { Cache::forget('dashboard:stats'); }
}
```

## See Also

- [db-eager-loading](./db-eager-loading.md)
- [perf-array-over-object](./perf-array-over-object.md)
