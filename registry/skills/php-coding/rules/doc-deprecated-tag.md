# doc-deprecated-tag

> Use `@deprecated` with replacement guidance

## Why It Matters

The `@deprecated` tag warns developers not to use a method/class and tells them what to use instead. IDEs will strike through deprecated usages. Always include the version when it was deprecated and the replacement API.

## Bad

```php
<?php

declare(strict_types=1);

class UserService {
    public function findById(int $id): ?User {
        return User::find($id);
    }

    public function findByEmail(string $email): ?User {
        return User::where('email', $email)->first(); // Old API — no warning
    }

    // Removed without warning
    // public function findByUsername(string $username): ?User { }
}
```

## Good

```php
<?php

declare(strict_types=1);

class UserService {
    /**
     * Find a user by their email address.
     *
     * @deprecated since 2.5.0, use {@see UserRepository::findByEmail()} instead.
     *             This method will be removed in 3.0.0.
     */
    public function findByEmail(string $email): ?User {
        return User::where('email', $email)->first();
    }

    /**
     * Find a user by their username.
     *
     * @deprecated since 2.0.0, use {@see UserRepository::findByUsername()} instead.
     */
    public function findByUsername(string $username): ?User {
        trigger_error(
            __METHOD__ . ' is deprecated, use UserRepository::findByUsername() instead',
            E_USER_DEPRECATED,
        );
        return app(UserRepository::class)->findByUsername($username);
    }
}
```

## See Also

- [doc-phpdoc-public](./doc-phpdoc-public.md)
- [doc-changelog-keep](./doc-changelog-keep.md)
