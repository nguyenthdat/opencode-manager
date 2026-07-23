# async-fibers-use-case

> Use Fibers (PHP 8.1+) for cooperative concurrency

## Why It Matters

Fibers enable cooperative multitasking — they yield control back to the calling code, allowing multiple tasks to interleave without blocking. Use Fibers for I/O-bound operations (HTTP requests, DB queries) where waiting dominates CPU time.

## Bad

```php
<?php

declare(strict_types=1);

// Sequential HTTP requests — each blocks
$userData = file_get_contents('https://api.example.com/users/1');
$orderData = file_get_contents('https://api.example.com/orders/1');
$productData = file_get_contents('https://api.example.com/products/1');
// Total: sum of all request times
```

## Good

```php
<?php

declare(strict_types=1);

// Using Fibers with Revolt event loop
use Revolt\EventLoop;

$suspensions = [];
$fiber1 = new Fiber(function () use (&$suspensions): array {
    $suspensions[] = Fiber::suspend();
    return json_decode(file_get_contents('https://api.example.com/users/1'), true);
});

$fiber2 = new Fiber(function () use (&$suspensions): array {
    $suspensions[] = Fiber::suspend();
    return json_decode(file_get_contents('https://api.example.com/orders/1'), true);
});

// Start fibers
$fiber1->start();
$fiber2->start();

// Resume fibers — they run cooperatively
EventLoop::run();
```

## See Also

- [async-no-blocking-io](./async-no-blocking-io.md)
- [async-guzzle-async](./async-guzzle-async.md)
