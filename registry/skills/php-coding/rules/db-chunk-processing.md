# db-chunk-processing

> Use `chunk()`/`cursor()` for large result sets

## Why It Matters

Loading thousands of Eloquent models at once exhausts memory and can crash the process. `chunk()` processes records in batches, keeping memory constant. `cursor()` uses a generator for row-by-row processing.

## Bad

```php
<?php

declare(strict_types=1);

class InvoiceService {
    public function generateAll(): void {
        // Loads all 100K orders into memory — OOM error
        $orders = Order::where('status', 'pending')->get();

        foreach ($orders as $order) {
            $this->generateInvoice($order);
        }
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class InvoiceService {
    public function generateAll(): void {
        // chunk() — processes 500 at a time
        Order::where('status', 'pending')->chunk(500, function ($orders) {
            foreach ($orders as $order) {
                $this->generateInvoice($order);
            }
        });

        // cursor() — row-by-row with generator (lowest memory)
        foreach (Order::where('status', 'pending')->cursor() as $order) {
            $this->generateInvoice($order);
        }

        // lazy() — chunk behind the scenes (PHP 8.0+)
        foreach (Order::where('status', 'pending')->lazy(500) as $order) {
            $this->generateInvoice($order);
        }
    }
}
```

## See Also

- [db-eager-loading](./db-eager-loading.md)
- [perf-generator-yield](./perf-generator-yield.md)
