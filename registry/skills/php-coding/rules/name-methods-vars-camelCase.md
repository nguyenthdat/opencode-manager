# name-methods-vars-camelCase

> camelCase for methods, properties, variables

## Why It Matters

camelCase (first word lowercase, subsequent words capitalized) is the PSR-1 standard for methods and variables. It visually distinguishes them from PascalCase types, making code scannable.

## Bad

```php
<?php

declare(strict_types=1);

class UserService {
    public int $MaxRetries;
    public string $email_address;

    public function SendNotification(): void {}
    public function get_user_by_id(int $id): ?User {}
}

$UserCount = 0;
$first_name = 'John';
```

## Good

```php
<?php

declare(strict_types=1);

class UserService {
    public int $maxRetries;
    public string $emailAddress;

    public function sendNotification(): void {}
    public function getUserById(int $id): ?User {}
}

$userCount = 0;
$firstName = 'John';
```

## See Also

- [name-classes-PascalCase](./name-classes-PascalCase.md)
- [name-constants-UPPER_SNAKE](./name-constants-UPPER_SNAKE.md)
