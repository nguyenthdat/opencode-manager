# async-worker-pool

> Pool workers for parallel processing

## Why It Matters

For CPU-bound parallel work (image processing, data transformation), use worker pools. With Swoole, use `Swoole\Process\Pool`. With plain PHP, use `pcntl_fork` or the parallel extension (Zend). Avoid blocking the main event loop.

## Bad

```php
<?php

declare(strict_types=1);

// Process images sequentially — slow
foreach ($images as $image) {
    $resized = resizeImage($image, 800, 600);
    $optimized = optimizeImage($resized);
    saveImage($optimized);
}
```

## Good

```php
<?php

declare(strict_types=1);

// Swoole process pool
use Swoole\Process\Pool;

$pool = new Pool(4); // 4 worker processes

$pool->on('WorkerStart', function (Pool $pool, int $workerId) use ($images) {
    $chunk = array_chunk($images, ceil(count($images) / 4))[$workerId] ?? [];

    foreach ($chunk as $image) {
        $resized = resizeImage($image, 800, 600);
        $optimized = optimizeImage($resized);
        saveImage($optimized);
    }
});

$pool->start();

// Pure PHP with pcntl_fork
$workers = 4;
$chunks = array_chunk($images, ceil(count($images) / $workers));

for ($i = 0; $i < $workers; $i++) {
    $pid = pcntl_fork();
    if ($pid === 0) {
        foreach ($chunks[$i] ?? [] as $image) {
            processImage($image);
        }
        exit(0);
    }
}

while (pcntl_waitpid(0, $status) !== -1); // Wait for all children
```

## See Also

- [async-queue-jobs](./async-queue-jobs.md)
- [async-swoole-open-swoole](./async-swoole-open-swoole.md)
