# db-index-strategy

> Index foreign keys and WHERE/JOIN columns

## Why It Matters

Queries without proper indexes perform full table scans, which get exponentially slower as tables grow. Index foreign key columns (used in JOINs), columns in WHERE clauses, and columns used for ORDER BY and GROUP BY.

## Bad

```php
<?php

declare(strict_types=1);

// No index on frequently queried columns
class CreateOrdersTable extends Migration {
    public function up(): void {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('status');
            $table->decimal('total', 10, 2);
            $table->timestamps();
            // No foreign key, no index on user_id or status
        });
    }
}

// Query without index — full table scan
Order::where('user_id', $userId)->where('status', 'pending')->get();
```

## Good

```php
<?php

declare(strict_types=1);

class CreateOrdersTable extends Migration {
    public function up(): void {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('status');
            $table->decimal('total', 10, 2);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users');
            $table->index('user_id');        // For WHERE user_id = ?
            $table->index('status');         // For WHERE status = ?
            $table->index('created_at');     // For ORDER BY created_at

            // Composite index for common query patterns
            $table->index(['user_id', 'status']); // WHERE user_id AND status
        });
    }
}

// Same query — uses composite index
Order::where('user_id', $userId)->where('status', 'pending')->get();
```

## See Also

- [db-eager-loading](./db-eager-loading.md)
- [db-chunk-processing](./db-chunk-processing.md)
