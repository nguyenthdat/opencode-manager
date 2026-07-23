# anti-magic-methods-overuse

> Don't overuse `__get`/`__set`/`__call` magic methods

## Why It Matters

Magic methods obscure the actual API of a class. IDEs can't autocomplete them, static analysis can't verify them, and they're much slower than regular method calls. Use explicit methods. Only use `__get`/`__set` in very specific cases like proxy objects.

## Bad

```php
<?php

declare(strict_types=1);

class User {
    private array $attributes = [];

    public function __get(string $name): mixed {
        return $this->attributes[$name] ?? null;
    }

    public function __set(string $name, mixed $value): void {
        $this->attributes[$name] = $value;
    }

    public function __call(string $name, array $args): mixed {
        if (str_starts_with($name, 'findBy')) {
            $field = lcfirst(substr($name, 6));
            return $this->where($field, $args[0]);
        }
        throw new \BadMethodCallException();
    }
}

$user = new User();
$user->name = 'John';          // __set — no autocomplete
$user->email = 'john@test.com'; // __set — typos not caught
echo $user->naem;               // __get — typo returns null!
```

## Good

```php
<?php

declare(strict_types=1);

class User {
    public function __construct(
        private string $name,
        private string $email,
        private ?string $phone = null,
    ) {}

    public function getName(): string { return $this->name; }
    public function getEmail(): string { return $this->email; }
    public function getPhone(): ?string { return $this->phone; }

    public function withName(string $name): self {
        return new self($name, $this->email, $this->phone);
    }

    // Explicit methods — IDE autocompletion, static analysis, refactoring
}

$user = new User('John', 'john@test.com');
echo $user->getName(); // IDE: full autocomplete, safe rename

// If you must use magic (e.g., for proxies), document it heavily
/**
 * @method string getName()
 * @method string getEmail()
 */
class LazyUserProxy {
    public function __call(string $name, array $args): mixed { /* ... */ }
}
```

## See Also

- [anti-array-access-object](./anti-array-access-object.md)
- [oop-encapsulation](./oop-encapsulation.md)
