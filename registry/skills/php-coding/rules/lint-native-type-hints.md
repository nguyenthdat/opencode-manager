# lint-native-type-hints

> Use native PHP type hints over PHPDoc-only types

## Why It Matters

Native type hints are enforced at runtime and by static analysis. PHPDoc types are comments — PHP ignores them. Always use native types (`string`, `int`, `?User`, `array`) when possible. Use PHPDoc only for generics and array shapes that PHP can't express.

## Bad

```php
<?php

declare(strict_types=1);

class UserRepository {
    /**
     * @param int $id
     * @return User|null
     */
    public function find($id) {
        return User::find($id);
    }

    /**
     * @param string $email
     * @param string $name
     * @return User
     */
    public function create($email, $name) {
        return User::create(['email' => $email, 'name' => $name]);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class UserRepository {
    public function find(int $id): ?User {
        return User::find($id);
    }

    public function create(string $email, string $name): User {
        return User::create(['email' => $email, 'name' => $name]);
    }

    /**
     * @param array<int, User> $users
     * @return array<int, string>
     */
    public function getNames(array $users): array {
        return array_map(fn(User $u): string => $u->name, $users);
    }
}
```

## See Also

- [lint-return-type](./lint-return-type.md)
- [type-parameter-return](./type-parameter-return.md)
