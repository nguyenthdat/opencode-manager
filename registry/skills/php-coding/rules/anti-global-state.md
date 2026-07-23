# anti-global-state

> Don't use global variables or static state

## Why It Matters

Global and static state create hidden dependencies between unrelated code. Tests become interdependent and flaky. Any state should be explicitly passed or managed by the DI container. Mutating `$_SERVER`, `$_GET`, or `$_POST` in application code is especially dangerous.

## Bad

```php
<?php

declare(strict_types=1);

$GLOBALS['config'] = parse_ini_file('config.ini');
global $db;

function connect(): void {
    global $db;
    $db = new PDO('...');
}

class Logger {
    public static bool $enabled = true;
    public static array $messages = [];

    public static function log(string $msg): void {
        if (self::$enabled) {
            self::$messages[] = $msg;
        }
    }
}

function process(): void {
    Logger::$enabled = false; // Affects every call to Logger::log
}
```

## Good

```php
<?php

declare(strict_types=1);

class AppConfig {
    public function __construct(
        public readonly string $dbDsn,
        public readonly string $dbUser,
        public readonly string $dbPass,
    ) {}
}

class DatabaseConnection {
    public function __construct(private AppConfig $config) {}
    public function connect(): PDO { /* ... */ }
}

class Logger {
    /** @var string[] */
    private array $messages = [];

    public function __construct(private bool $enabled = true) {}

    public function log(string $msg): void {
        if ($this->enabled) {
            $this->messages[] = $msg;
        }
    }
}

// Each instance has its own state — no global side effects
$logger = new Logger(enabled: false);
$logger->log('test'); // Only affects this $logger instance
```

## See Also

- [anti-static-coupling](./anti-static-coupling.md)
- [anti-singleton-misuse](./anti-singleton-misuse.md)
