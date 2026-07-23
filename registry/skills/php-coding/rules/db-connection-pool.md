# db-connection-pool

> Configure connection pooling in production

## Why It Matters

Without connection pooling, each request opens a new database connection (TCP handshake, auth), adding latency. Persistent connections in PHP-FPM and connection pooling in Swoole/ReactPHP keep connections alive across requests.

## Bad

```php
<?php

declare(strict_types=1);

// database.php — no persistent connections
'mysql' => [
    'driver' => 'mysql',
    'host' => env('DB_HOST'),
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
    // persistent not enabled — new connection per request
    // pool not configured in Swoole
],
```

## Good

```php
<?php

declare(strict_types=1);

// For PHP-FPM with persistent connections
'mysql' => [
    'driver' => 'mysql',
    // ...
    'options' => [
        PDO::ATTR_PERSISTENT => true, // Keep connections alive across requests
    ],
],

// For Swoole — connection pool
use Swoole\Database\PDOConfig;
use Swoole\Database\PDOPool;

$pool = new PDOPool(
    (new PDOConfig())
        ->withHost('127.0.0.1')
        ->withPort(3306)
        ->withDbName('app')
        ->withUsername('user')
        ->withPassword('pass'),
    32 // Pool size
);

// Min/Max connections per worker
'mysql' => [
    'pool' => [
        'min_connections' => 5,
        'max_connections' => 20,
        'idle_timeout' => 60,
    ],
],
```

## See Also

- [async-swoole-open-swoole](./async-swoole-open-swoole.md)
- [perf-opcache-enable](./perf-opcache-enable.md)
