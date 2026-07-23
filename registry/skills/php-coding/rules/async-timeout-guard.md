# async-timeout-guard

> Set timeouts on all async operations

## Why It Matters

Without timeouts, an async operation can hang indefinitely, exhausting connections and blocking the process. Always set explicit timeouts on HTTP requests, queue operations, and DB queries in async contexts.

## Bad

```php
<?php

declare(strict_types=1);

// No timeout — can hang forever
$response = $client->get('https://slow-api.example.com/data');

// DB query with no timeout
$pdo->query('SELECT * FROM large_table');

// Queue pop with no timeout
$job = $queue->pop(); // Blocks forever if empty
```

## Good

```php
<?php

declare(strict_types=1);

// HTTP with timeout
$client = new \GuzzleHttp\Client([
    'timeout' => 10,          // Total request timeout
    'connect_timeout' => 5,   // Connection timeout
    'read_timeout' => 10,     // Read timeout
]);
try {
    $response = $client->get('https://slow-api.example.com/data');
} catch (\GuzzleHttp\Exception\ConnectException $e) {
    logger()->error('Connection timeout');
}

// PDO with timeout
$pdo->setAttribute(PDO::ATTR_TIMEOUT, 5);
$pdo->query('SELECT * FROM large_table');

// Queue with timeout
$job = $queue->pop(['timeout' => 30]);

// Fiber with timeout
use Revolt\EventLoop;

$watcher = EventLoop::delay(10.0, function () use ($fiber) {
    // Resume with null after 10s timeout
    if ($fiber->isSuspended()) {
        $fiber->resume(null);
    }
});
```

## See Also

- [async-retry-exponential](./async-retry-exponential.md)
- [err-catch-specific](./err-catch-specific.md)
