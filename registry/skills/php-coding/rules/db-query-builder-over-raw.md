# db-query-builder-over-raw

> Use query builder/ORM over raw SQL

## Why It Matters

Query builders provide parameterized queries automatically, preventing SQL injection. They're database-agnostic, enable easy refactoring, and provide autocompletion. Raw SQL should be a last resort for complex queries the ORM can't express.

## Bad

```php
<?php

declare(strict_types=1);

class UserRepository {
    public function findActiveByRole(string $role): array {
        return DB::select(
            "SELECT u.* FROM users u
             JOIN role_user ru ON u.id = ru.user_id
             JOIN roles r ON ru.role_id = r.id
             WHERE r.name = '{$role}' AND u.status = 'active'
             ORDER BY u.created_at DESC
             LIMIT 50"
        );
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class UserRepository {
    public function findActiveByRole(string $role): array {
        return User::query()
            ->select('users.*')
            ->join('role_user', 'users.id', '=', 'role_user.user_id')
            ->join('roles', 'role_user.role_id', '=', 'roles.id')
            ->where('roles.name', $role)
            ->where('users.status', 'active')
            ->orderByDesc('users.created_at')
            ->limit(50)
            ->get();
    }

    // For truly complex analytical queries — raw with parameterization
    public function getMonthlyStats(): array {
        return DB::select(
            'SELECT DATE_FORMAT(created_at, :format) as month, COUNT(*) as total
             FROM orders WHERE created_at >= :since GROUP BY month',
            ['format' => '%Y-%m', 'since' => now()->subYear()]
        );
    }
}
```

## See Also

- [sec-sql-injection](./sec-sql-injection.md)
- [db-select-specific](./db-select-specific.md)
