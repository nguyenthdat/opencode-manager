# anti-singleton-misuse

> Don't use Singleton pattern for DI container bypassing

## Why It Matters

The Singleton pattern (private constructor + static `getInstance()`) is often used as a poor man's service locator. It creates global state, prevents testing with mocks, and makes dependency chains invisible. Use proper dependency injection instead.

## Bad

```php
<?php

declare(strict_types=1);

class Database {
    private static ?self $instance = null;

    private function __construct() {}
    private function __clone() {}

    public static function getInstance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function query(string $sql): array {
        // ...
    }
}

// Hard to test — can't inject mock
class UserService {
    public function find(int $id): ?User {
        return Database::getInstance()->query("SELECT * FROM users WHERE id = {$id}");
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

interface DatabaseInterface {
    public function query(string $sql, array $params = []): array;
}

class MySqlDatabase implements DatabaseInterface {
    public function query(string $sql, array $params = []): array {
        // ...
    }
}

class UserService {
    public function __construct(private DatabaseInterface $db) {}

    public function find(int $id): ?User {
        return $this->db->query('SELECT * FROM users WHERE id = ?', [$id]);
    }
}

// Container manages singleton lifecycle if needed
$this->app->singleton(DatabaseInterface::class, MySqlDatabase::class);
```

## See Also

- [anti-global-state](./anti-global-state.md)
- [di-no-service-locator](./di-no-service-locator.md)
