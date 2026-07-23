# async-guzzle-async

> Use Guzzle promise pool for concurrent HTTP

## Why It Matters

Guzzle's promise pool sends multiple HTTP requests concurrently, dramatically reducing total time for batch API calls. Instead of sequential requests, send them in parallel and wait for all to complete.

## Bad

```php
<?php

declare(strict_types=1);

use GuzzleHttp\Client;

$client = new Client();
$results = [];

$urls = [
    'https://api.example.com/users/1',
    'https://api.example.com/users/2',
    'https://api.example.com/users/3',
];

// Sequential — each waits for the previous
foreach ($urls as $url) {
    $results[] = json_decode($client->get($url)->getBody(), true);
}
```

## Good

```php
<?php

declare(strict_types=1);

use GuzzleHttp\Client;
use GuzzleHttp\Pool;
use GuzzleHttp\Psr7\Request;

$client = new Client(['timeout' => 10]);
$results = [];

$requests = function () use ($urls) {
    foreach (['users/1', 'users/2', 'users/3'] as $path) {
        yield new Request('GET', "https://api.example.com/{$path}");
    }
};

$pool = new Pool($client, $requests(), [
    'concurrency' => 5,
    'fulfilled' => function (ResponseInterface $response, int $index) use (&$results) {
        $results[$index] = json_decode($response->getBody(), true);
    },
    'rejected' => function (RequestException $reason, int $index) {
        logger()->error("Request {$index} failed", ['error' => $reason->getMessage()]);
    },
]);

$pool->promise()->wait(); // Wait for all to complete
```

## See Also

- [async-fibers-use-case](./async-fibers-use-case.md)
- [async-timeout-guard](./async-timeout-guard.md)
