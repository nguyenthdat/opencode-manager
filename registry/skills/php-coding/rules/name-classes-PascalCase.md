# name-classes-PascalCase

> PascalCase for classes, interfaces, traits, enums

## Why It Matters

PascalCase (each word capitalized) distinguishes types from variables and functions. This is the PSR-1 standard and universally recognized in PHP. Consistency in naming is critical for readability across teams.

## Bad

```php
<?php

declare(strict_types=1);

class user_manager {}
class http_client {}
interface sendable {}
trait loggable_behavior {}
enum order_status: string { case pending = 'pending'; }
```

## Good

```php
<?php

declare(strict_types=1);

class UserManager {}
class HttpClient {}
interface Sendable {}
trait LoggableBehavior {}
enum OrderStatus: string { case Pending = 'pending'; }
```

## See Also

- [name-methods-vars-camelCase](./name-methods-vars-camelCase.md)
- [name-interfaces-suffix](./name-interfaces-suffix.md)
