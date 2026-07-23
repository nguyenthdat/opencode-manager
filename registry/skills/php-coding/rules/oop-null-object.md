# oop-null-object

> Use Null Object pattern over null checks

## Why It Matters

The Null Object pattern provides a non-functional object that conforms to an interface, eliminating null checks throughout the codebase. Instead of checking `if ($obj === null)`, you provide a null implementation that does nothing safely.

## Bad

```php
<?php

declare(strict_types=1);

interface LoggerInterface { public function log(string $msg, array $ctx = []): void; }

class Service {
    private ?LoggerInterface $logger;
    public function setLogger(?LoggerInterface $logger): void { $this->logger = $logger; }

    public function process(): void {
        if ($this->logger !== null) $this->logger->log('Processing started');
        // ...
        if ($this->logger !== null) $this->logger->log('Processing completed');
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

interface LoggerInterface { public function log(string $msg, array $ctx = []): void; }

class NullLogger implements LoggerInterface { public function log(string $msg, array $ctx = []): void {} }

class Service {
    public function __construct(private LoggerInterface $logger = new NullLogger()) {}

    public function process(): void {
        $this->logger->log('Processing started'); // Always safe
        // ...
        $this->logger->log('Processing completed');
    }
}
```

## See Also

- [oop-dependency-injection](./oop-dependency-injection.md)
- [type-nullsafe-operator](./type-nullsafe-operator.md)
