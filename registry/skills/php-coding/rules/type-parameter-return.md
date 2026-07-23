# type-parameter-return

> Add type declarations to all method parameters and returns

## Why It Matters

Type declarations serve as documentation and runtime enforcement. They catch type errors early, enable static analysis (PHPStan/Psalm) to detect bugs, and improve IDE autocompletion. Every method signature should declare both parameter types and a return type.

## Bad

```php
<?php

class UserService {
    public function find($id) {
        return $this->db->query("SELECT * FROM users WHERE id = ?", [$id]);
    }

    public function create($data) {
        // No idea what shape $data should be
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class UserService {
    public function find(int $id): ?User {
        $row = $this->db->query(
            'SELECT * FROM users WHERE id = ?',
            [$id]
        );
        return $row ? User::fromRow($row) : null;
    }

    /** @param array{name: string, email: string} $data */
    public function create(array $data): User {
        return User::create($data);
    }
}
```

## See Also

- [type-strict-types](./type-strict-types.md)
- [type-nullable-explicit](./type-nullable-explicit.md)
