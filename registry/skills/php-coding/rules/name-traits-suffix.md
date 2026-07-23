# name-traits-suffix

> Suffix traits with Trait

## Why It Matters

The `Trait` suffix distinguishes traits from classes and interfaces, making code more readable. It prevents confusion when a trait and class share a name and makes dependency discovery easier.

## Bad

```php
<?php

declare(strict_types=1);

trait HasTimestamps {}
trait SoftDeletes {}
trait Loggable {}

class User {
    use HasTimestamps, SoftDeletes, Loggable;
    // Are these traits or classes? Must look at imports
}
```

## Good

```php
<?php

declare(strict_types=1);

trait HasTimestampsTrait {}
trait SoftDeletesTrait {}
trait LoggableTrait {}

class User {
    use HasTimestampsTrait, SoftDeletesTrait, LoggableTrait;
    // Trait suffix — immediately clear these are traits
}
```

## See Also

- [name-interfaces-suffix](./name-interfaces-suffix.md)
- [name-abstract-prefix](./name-abstract-prefix.md)
