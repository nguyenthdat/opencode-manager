# async-swoole-open-swoole

> Use Swoole/OpenSwoole for high-concurrency servers

## Why It Matters

Swoole provides an async, event-driven runtime for PHP with coroutines, an HTTP server, WebSocket support, and connection pooling. It's ideal for high-concurrency applications (10K+ connections) where traditional PHP-FPM struggles.

## Bad

```php
<?php

declare(strict_types=1);

// Traditional PHP-FPM — one process per request
// index.php
echo json_encode(['status' => 'ok']);

// Nginx config
// fastcgi_pass php-fpm:9000;
```

## Good

```php
<?php

declare(strict_types=1);

// Swoole HTTP server — handles 10K+ concurrent connections
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('0.0.0.0', 9501);

$server->on('request', function (Request $request, Response $response) {
    // Coroutine-based — non-blocking
    $response->header('Content-Type', 'application/json');
    $response->end(json_encode(['status' => 'ok']));
});

// Connection pool — reuse connections across requests
$pool = new Swoole\Database\PDOPool(
    new Swoole\Database\PDOConfig()
        ->withHost('127.0.0.1')
        ->withPort(3306)
        ->withDbName('app')
        ->withUsername('user')
        ->withPassword('pass'),
    64, // Pool size
);

$server->start();
```

## See Also

- [async-fibers-use-case](./async-fibers-use-case.md)
- [async-worker-pool](./async-worker-pool.md)
