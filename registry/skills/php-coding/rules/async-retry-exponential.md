# async-retry-exponential

> Exponential backoff for async operation retries

## Why It Matters

Transient failures (network timeouts, rate limits) often resolve on retry. Use exponential backoff — increase the delay between retries exponentially (1s, 2s, 4s, 8s...). Add jitter to prevent thundering herd problems.

## Bad

```php
<?php

declare(strict_types=1);

function sendWithRetry(string $message): bool {
    $maxRetries = 3;
    for ($i = 0; $i < $maxRetries; $i++) {
        try {
            $api->send($message);
            return true;
        } catch (NetworkException $e) {
            // Retry immediately — may still fail
        }
    }
    return false;
}
```

## Good

```php
<?php

declare(strict_types=1);

class RetryHandler {
    public function execute(callable $operation, int $maxRetries = 3): mixed {
        $attempt = 0;

        while (true) {
            try {
                return $operation();
            } catch (\Throwable $e) {
                $attempt++;
                if ($attempt >= $maxRetries || !$this->isRetryable($e)) {
                    throw $e;
                }

                // Exponential backoff: 1s, 2s, 4s, 8s
                $delay = (2 ** ($attempt - 1)) * 1000;
                // Add jitter: +/- 25%
                $jitter = random_int(-$delay * 25, $delay * 25) / 100;
                $delay += $jitter;

                logger()->warning("Retry attempt {$attempt}/{$maxRetries}, delay: {$delay}ms", [
                    'error' => $e->getMessage(),
                ]);

                usleep((int) $delay * 1000);
            }
        }
    }

    private function isRetryable(\Throwable $e): bool {
        return $e instanceof NetworkException
            || $e instanceof TimeoutException
            || ($e instanceof HttpException && $e->getCode() >= 500);
    }
}
```

## See Also

- [async-timeout-guard](./async-timeout-guard.md)
- [err-log-and-throw](./err-log-and-throw.md)
