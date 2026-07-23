# oop-trait-over-abstract

> Use traits for shared behavior; interfaces for contracts

## Why It Matters

Abstract classes force a single inheritance hierarchy that may not fit your domain. Traits provide horizontal code reuse without consuming the single inheritance slot. Interfaces define contracts (what), traits provide implementation (how).

## Bad

```php
<?php

declare(strict_types=1);

abstract class Loggable {
    protected function log(string $message, string $level = 'info'): void {
        Logger::log($level, static::class . ': ' . $message);
    }
}

class User extends Loggable {
    // User is permanently coupled to Loggable — can't extend Model
}
```

## Good

```php
<?php

declare(strict_types=1);

trait Loggable {
    protected function log(string $message, string $level = 'info'): void {
        Logger::log($level, static::class . ': ' . $message);
    }
}

interface LoggableInterface {
    public function getLogContext(): array;
}

class User extends Model implements LoggableInterface {
    use Loggable;
    public function getLogContext(): array { return ['user_id' => $this->id]; }
}
```

## See Also

- [oop-composition-over-inheritance](./oop-composition-over-inheritance.md)
- [oop-interface-segregation](./oop-interface-segregation.md)
