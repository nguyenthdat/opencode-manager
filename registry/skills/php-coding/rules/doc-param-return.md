# doc-param-return

> Document `@param` and `@return` with types

## Why It Matters

Complete `@param` and `@return` tags enable static analysis tools to verify type usage throughout the codebase. They serve as the contract for callers. Always include the type, parameter name, and a description.

## Bad

```php
<?php

declare(strict_types=1);

class UserRepository {
    /**
     * Find users
     */
    public function findByStatus(string $status): array {
        return $this->db->query('SELECT * FROM users WHERE status = ?', [$status]);
    }

    /**
     * @param array $data
     * @return mixed
     */
    public function create(array $data) {
        return User::create($data);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class UserRepository {
    /**
     * Finds all users with the given status.
     *
     * @param string $status The user status to filter by
     * @return User[] Array of User objects
     */
    public function findByStatus(string $status): array {
        return $this->db->query('SELECT * FROM users WHERE status = ?', [$status]);
    }

    /**
     * Creates a new user from the provided data.
     *
     * @param array{name: string, email: string} $data The user data
     * @return User The newly created user
     * @throws ValidationException When the data is invalid
     */
    public function create(array $data): User {
        return User::create($data);
    }
}
```

## See Also

- [doc-phpdoc-public](./doc-phpdoc-public.md)
- [doc-throws-tag](./doc-throws-tag.md)
