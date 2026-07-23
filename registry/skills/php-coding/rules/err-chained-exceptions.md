# err-chained-exceptions

> Use `$previous` parameter for exception chaining

## Why It Matters

Exception chaining preserves the full error chain, enabling root-cause analysis. When wrapping a lower-level exception in a domain exception, pass it as `$previous`. Tools like Sentry/Bugsnag display the full chain.

## Bad

```php
<?php

declare(strict_types=1);

class UserRepository {
    public function find(int $id): User {
        try {
            $row = $this->db->query('SELECT * FROM users WHERE id = ?', [$id]);
        } catch (\PDOException $e) {
            throw new RepositoryException("Failed to find user {$id}");
        }
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class RepositoryException extends \RuntimeException {
    public function __construct(string $message = '', ?\Throwable $previous = null) {
        parent::__construct($message, 0, $previous);
    }
}

class UserRepository {
    public function find(int $id): User {
        try {
            $row = $this->db->query('SELECT * FROM users WHERE id = ?', [$id]);
        } catch (\PDOException $e) {
            throw new RepositoryException(
                message: "Failed to find user {$id}", previous: $e,
            );
        }
    }
}

try { $repo->find(42); }
catch (RepositoryException $e) {
    echo $e->getMessage(); // "Failed to find user 42"
    echo $e->getPrevious()->getMessage(); // Original PDO error
}
```

## See Also

- [err-custom-exceptions](./err-custom-exceptions.md)
- [err-exception-context](./err-exception-context.md)
