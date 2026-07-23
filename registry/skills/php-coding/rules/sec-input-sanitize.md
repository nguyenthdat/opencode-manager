# sec-input-sanitize

> Validate AND sanitize all user input

## Why It Matters

Validate to check that input meets business rules (type, range, format). Sanitize to remove or encode dangerous characters. Both are necessary — validation rejects bad input, sanitization ensures safe handling of accepted input.

## Bad

```php
<?php

declare(strict_types=1);

$name = $_POST['name'];
$email = $_POST['email'];
$age = $_POST['age'];

// No validation, no sanitization
User::create(['name' => $name, 'email' => $email, 'age' => $age]);
```

## Good

```php
<?php

declare(strict_types=1);

$name = trim(strip_tags($_POST['name']));
$email = filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL);
$age = filter_var($_POST['age'], FILTER_VALIDATE_INT);

if ($name === '' || strlen($name) > 255) {
    throw new ValidationException('Name must be 1-255 characters');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    throw new ValidationException('Invalid email format');
}
if ($age === false || $age < 0 || $age > 150) {
    throw new ValidationException('Invalid age');
}

User::create(['name' => $name, 'email' => $email, 'age' => $age]);
```

## See Also

- [sec-sql-injection](./sec-sql-injection.md)
- [sec-xss-prevention](./sec-xss-prevention.md)
