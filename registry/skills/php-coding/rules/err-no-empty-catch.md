# err-no-empty-catch

> Never catch without logging or rethrowing

## Why It Matters

Silently swallowing exceptions hides bugs, corrupts data, and makes debugging nearly impossible. If you catch an exception, you must either log it, rethrow it (wrapped or as-is), or take a specific recovery action.

## Bad

```php
<?php

declare(strict_types=1);

try {
    $user = User::find($id);
    $user->update($data);
} catch (\Exception $e) {
    // Ignored — data might be half-updated, nobody knows
}

try {
    $result = $api->fetchPrices();
} catch (\Exception $e) {
    error_log('API error'); // No details, no recovery
}
```

## Good

```php
<?php

declare(strict_types=1);

try {
    $user = User::find($id);
    $user->update($data);
} catch (UserNotFoundException $e) {
    logger()->warning('User not found for update', ['user_id' => $id]);
    throw $e;
} catch (ValidationException $e) {
    logger()->info('Validation failed', ['user_id' => $id, 'errors' => $e->getErrors()]);
    throw $e;
}

try {
    $prices = $api->fetchPrices();
} catch (ApiException $e) {
    logger()->error('API unavailable, using cached', ['error' => $e->getMessage()]);
    $prices = Cache::get('prices:latest');
}
```

## See Also

- [err-exception-context](./err-exception-context.md)
- [err-log-and-throw](./err-log-and-throw.md)
