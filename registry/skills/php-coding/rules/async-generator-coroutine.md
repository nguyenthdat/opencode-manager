# async-generator-coroutine

> Use generators as coroutines (yield in Fibers)

## Why It Matters

PHP generators with `yield` can be used as lightweight coroutines in Fiber-based async frameworks. Yield control back to the event loop, enabling cooperative multitasking without complex callback chains.

## Bad

```php
<?php

declare(strict_types=1);

// Manual callback chaining — callback hell
function fetchUserData(int $id, callable $onSuccess, callable $onError): void {
    makeRequest("/users/{$id}", function ($user) use ($onSuccess, $onError) {
        makeRequest("/orders?user_id={$user['id']}", function ($orders) use ($user, $onSuccess, $onError) {
            $onSuccess(['user' => $user, 'orders' => $orders]);
        }, $onError);
    }, $onError);
}
```

## Good

```php
<?php

declare(strict_types=1);

// Coroutine-style with Fiber + Amp
use function Amp\async;
use function Amp\delay;

class UserDataService {
    public function getUserWithOrders(int $userId): array {
        $user = async(function () use ($userId) {
            return $this->api->get("/users/{$userId}");
        });

        $orders = async(function () use ($userId) {
            return $this->api->get("/orders", ['user_id' => $userId]);
        });

        // Wait for both — runs concurrently
        return [
            'user' => $user->await(),
            'orders' => $orders->await(),
        ];
    }
}

// Generator-based coroutine
function fetchUserData(int $id): Generator {
    $user = yield from fetchAsync("/users/{$id}");
    $orders = yield from fetchAsync("/orders?user_id={$id}");
    return ['user' => $user, 'orders' => $orders];
}
```

## See Also

- [async-fibers-use-case](./async-fibers-use-case.md)
- [async-guzzle-async](./async-guzzle-async.md)
