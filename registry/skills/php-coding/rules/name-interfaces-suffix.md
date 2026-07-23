# name-interfaces-suffix

> Suffix interfaces (e.g. -able, Contract, or prefix I)

## Why It Matters

Interface naming conventions signal that a type is an interface, not a concrete class. Choose one convention and stick to it. Common PHP conventions: `-able` for capabilities (Serializable), `Contract` suffix (Laravel), or `I` prefix.

## Bad

```php
<?php

declare(strict_types=1);

interface Logger {}
interface Send {}
interface Payment {}

// Ambiguous — are these interfaces or classes?
$logger = new FileLogger();
$service = app(Payment::class);
```

## Good

```php
<?php

declare(strict_types=1);

// Option 1: -able suffix for capabilities
interface Loggable {}
interface Serializable {}
interface Arrayable {}

// Option 2: Contract suffix (Laravel style)
interface LoggerContract {}
interface PaymentContract {}

// Option 3: Interface suffix (Symfony style)
interface LoggerInterface {}
interface CacheInterface {}
interface EntityManagerInterface {}

// Consistent within project
$logger = app(LoggerInterface::class);
```

## See Also

- [name-classes-PascalCase](./name-classes-PascalCase.md)
- [name-traits-suffix](./name-traits-suffix.md)
