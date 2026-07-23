# name-constants-UPPER_SNAKE

> UPPER_SNAKE_CASE for class constants

## Why It Matters

UPPER_SNAKE_CASE visually distinguishes constants (immutable, class-level) from properties and variables. This is a long-standing PHP convention and the PSR-1 recommendation.

## Bad

```php
<?php

declare(strict_types=1);

class Config {
    public const defaultTimeout = 30;
    public const Max_Retries = 3;
    public const apiBaseUrl = 'https://api.example.com';
}

$timeout = Config::defaultTimeout;
```

## Good

```php
<?php

declare(strict_types=1);

class Config {
    public const DEFAULT_TIMEOUT = 30;
    public const MAX_RETRIES = 3;
    public const API_BASE_URL = 'https://api.example.com';
}

$timeout = Config::DEFAULT_TIMEOUT;
```

## See Also

- [name-classes-PascalCase](./name-classes-PascalCase.md)
- [name-enums-singular](./name-enums-singular.md)
