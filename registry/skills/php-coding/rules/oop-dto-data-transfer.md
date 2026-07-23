# oop-dto-data-transfer

> Use DTOs for input/output boundaries

## Why It Matters

Data Transfer Objects (DTOs) define explicit contracts for data entering and leaving your application. They decouple internal models from API/CLI inputs, enable validation at the boundary, and make data shape explicit for static analysis.

## Bad

```php
<?php

declare(strict_types=1);

class UserController {
    public function create(array $request): User {
        return User::create([
            'name' => $request['name'] ?? '',
            'email' => $request['email'] ?? '',
            'age' => $request['age'] ?? 0,
        ]);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

readonly class CreateUserRequest {
    public function __construct(
        public string $name,
        public string $email,
        public ?int $age = null,
    ) {
        if (strlen($this->name) < 2) throw new ValidationException('Name must be at least 2 characters');
        if (!filter_var($this->email, FILTER_VALIDATE_EMAIL)) throw new ValidationException('Invalid email');
    }

    public static function fromArray(array $data): self {
        return new self(
            name: $data['name'] ?? throw new ValidationException('name is required'),
            email: $data['email'] ?? throw new ValidationException('email is required'),
            age: isset($data['age']) ? (int) $data['age'] : null,
        );
    }
}
```

## See Also

- [oop-value-objects](./oop-value-objects.md)
- [type-readonly-classes](./type-readonly-classes.md)
