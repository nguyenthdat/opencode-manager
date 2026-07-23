# async-no-blocking-io

> Avoid blocking I/O in Fibers/Swoole contexts

## Why It Matters

Blocking I/O operations (file_get_contents, PDO queries without async support) defeat the purpose of Fibers and Swoole by blocking the entire process. Use async-aware libraries or wrap blocking calls in a worker pool or `spawn_blocking` equivalent.

## Bad

```php
<?php

declare(strict_types=1);

// Inside a Fiber or Swoole coroutine
$fiber = new Fiber(function (): void {
    // BLOCKING — entire process stalls
    $data = file_get_contents('https://api.example.com/data');
    $result = $pdo->query('SELECT * FROM large_table');
    sleep(5); // Also blocking
});
```

## Good

```php
<?php

declare(strict_types=1);

// Async HTTP with Swoole coroutine client
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function () {
    $client = new Client('api.example.com', 443, true);
    $client->set(['timeout' => 10]);
    $client->get('/data');
    $data = $client->body;

    // Async MySQL with Swoole
    $db = new Swoole\Coroutine\MySQL();
    $db->connect(['host' => '127.0.0.1', 'user' => 'root', 'password' => '', 'database' => 'app']);
    $result = $db->query('SELECT * FROM large_table');
});

// With Fibers + Revolt — use async HTTP client
use Revolt\EventLoop;
use function Amp\Http\Client\request;

$fiber = new Fiber(function (): void {
    $response = request('https://api.example.com/data');
    $data = $response->getBody()->buffer();
    Fiber::suspend();
});
```

## See Also

- [async-fibers-use-case](./async-fibers-use-case.md)
- [async-worker-pool](./async-worker-pool.md)
