# di-auto-wiring

> Use auto-wiring; avoid manual resolution

## Why It Matters

Auto-wiring lets the container inspect constructor type-hints and resolve dependencies automatically. Manual resolution (e.g., `$app->make()`) is fragile, bypasses type checks, and couples code to the container.

## Bad

```php
<?php

declare(strict_types=1);

class ReportService {
    private DatabaseConnection $db;
    private CacheInterface $cache;

    public function __construct(Container $container) {
        $this->db = $container->make(DatabaseConnection::class);
        $this->cache = $container->make(CacheInterface::class);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class ReportService {
    public function __construct(
        private DatabaseConnection $db,
        private CacheInterface $cache,
    ) {}

    public function generate(int $id): Report {
        return $this->cache->remember("report:{$id}", 3600, function () use ($id) {
            $data = $this->db->query('SELECT * FROM reports WHERE id = ?', [$id]);
            return Report::fromRow($data);
        });
    }
}
```

## See Also

- [di-container-binding](./di-container-binding.md)
- [di-contract-resolution](./di-contract-resolution.md)
