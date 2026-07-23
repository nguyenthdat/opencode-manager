# perf-string-interpolation

> Use `"{$var}"` interpolation over concatenation

## Why It Matters

String interpolation is faster and more readable than concatenation. PHP optimizes double-quoted strings with variables. For multiple variables, interpolation avoids creating intermediate string objects.

## Bad

```php
<?php

declare(strict_types=1);

$name = 'John';
$age = 30;
$city = 'New York';

// Multiple concatenations — slow, hard to read
$message = 'Hello, ' . $name . '. You are ' . $age . ' years old from ' . $city . '.';

// Complex concatenation
$url = 'https://api.example.com/users/' . $userId . '/orders/' . $orderId . '?format=' . $format;
```

## Good

```php
<?php

declare(strict_types=1);

$name = 'John';
$age = 30;
$city = 'New York';

// Simple interpolation
$message = "Hello, {$name}. You are {$age} years old from {$city}.";

// Complex expressions — use braces
$message = "Hello, {$user->getName()}. You have {$user->getUnreadCount()} messages.";

// For URL building, prefer sprintf or http_build_query
$url = sprintf('https://api.example.com/users/%d/orders/%d?format=%s', $userId, $orderId, $format);

$params = ['format' => 'json', 'page' => 1];
$url = 'https://api.example.com/search?' . http_build_query($params);
```

## See Also

- [perf-array-over-object](./perf-array-over-object.md)
