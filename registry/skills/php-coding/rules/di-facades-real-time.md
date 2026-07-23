# di-facades-real-time

> Use real-time facades over traditional facades (Laravel)

## Why It Matters

Real-time facades (Laravel) let you type-hint class names and get facade-like static access without adding entries to the facade registry. They're discovered automatically and provide better IDE support and static analysis. Prefer explicit injection over any facade.

## Bad

```php
<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Cache;

class DashboardController {
    public function index(): View {
        $stats = Cache::remember('dashboard:stats', 3600, fn() => $this->calculateStats());
        return view('dashboard', ['stats' => $stats]);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class DashboardController {
    public function __construct(private CacheInterface $cache) {}

    public function index(): View {
        $stats = $this->cache->remember('dashboard:stats', 3600, fn() => $this->calculateStats());
        return view('dashboard', ['stats' => $stats]);
    }
}

// If you must use facades, real-time facades are slightly better:
// use Facades\App\Services\InvoiceService;
// InvoiceService::generate($order);
```

## See Also

- [di-no-service-locator](./di-no-service-locator.md)
- [di-contract-resolution](./di-contract-resolution.md)
