# perf-array-over-object

> Use arrays for simple data; objects for behavior

## Why It Matters

Arrays are memory-efficient for simple key-value data. Objects add overhead from method tables, property visibility tracking, and object headers. Use arrays for raw data transfer; use objects when you need methods, validation, or type guarantees.

## Bad

```php
<?php

declare(strict_types=1);

// Object for simple data — unnecessary overhead
class SimpleConfig {
    public function __construct(
        public string $host,
        public int $port,
        public bool $debug,
    ) {}
}

$config = new SimpleConfig('localhost', 3306, true);
echo $config->host;
echo $config->port;
```

## Good

```php
<?php

declare(strict_types=1);

// Array for simple key-value data
$config = [
    'host' => 'localhost',
    'port' => 3306,
    'debug' => true,
];
echo $config['host'];
echo $config['port'];

// Object for behavior — when methods are needed
class DatabaseConnection {
    public function __construct(
        private string $host,
        private int $port,
        private bool $debug,
    ) {}

    public function connect(): PDO {
        $dsn = "mysql:host={$this->host};port={$this->port}";
        return new PDO($dsn, /* ... */);
    }

    public function isDebugMode(): bool { return $this->debug; }
}
```

## See Also

- [oop-value-objects](./oop-value-objects.md)
- [perf-generator-yield](./perf-generator-yield.md)
