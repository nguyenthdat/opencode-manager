# type-nullable-explicit

> Use `?Type` or `Type|null` for nullable types

## Why It Matters

Explicit nullable types communicate that null is an expected value. This prevents null pointer errors by forcing the caller to handle the null case. Use `?Type` for simple cases and `Type|null` in union types for consistency.

## Bad

```php
<?php

declare(strict_types=1);

class UserRepository {
    public function findByEmail(string $email) {
        $row = $this->db->fetch("SELECT * FROM users WHERE email = ?", [$email]);
        return $row ? new User($row) : null;
    }

    public function setNickname($nickname) {
        $this->nickname = $nickname;
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class UserRepository {
    public function findByEmail(string $email): ?User {
        $row = $this->db->fetch(
            'SELECT * FROM users WHERE email = ?',
            [$email]
        );
        return $row ? new User($row) : null;
    }

    public function setNickname(?string $nickname): void {
        $this->nickname = $nickname;
    }
}
```

## See Also

- [type-union-intersection](./type-union-intersection.md)
- [type-parameter-return](./type-parameter-return.md)
