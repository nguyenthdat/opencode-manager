# err-throwable-vs-exception

> Catch `\Throwable` only at top-level error handlers

## Why It Matters

`\Throwable` includes `\Error` (TypeError, ParseError, AssertionError) — these indicate programming bugs, not runtime errors. Catch `\Throwable` only in framework-level exception handlers or bootstrapping code.

## Bad

```php
<?php

declare(strict_types=1);

function processData(array $data): void {
    try {
        $value = $data['key']->method();
        saveResult($value);
    } catch (\Throwable $e) {
        logger()->error('Processing failed');
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

set_exception_handler(function (\Throwable $e): void {
    logger()->emergency('Unhandled throwable', [
        'class' => get_class($e), 'message' => $e->getMessage(), 'trace' => $e->getTraceAsString(),
    ]);
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
});

function processData(array $data): void {
    try {
        $value = $data['key']->method();
        saveResult($value);
    } catch (ValidationException $e) {
        logger()->warning('Validation failed', ['errors' => $e->getErrors()]);
    } catch (StorageException $e) {
        logger()->error('Storage failed', ['error' => $e->getMessage()]);
        throw $e;
    }
}
```

## See Also

- [err-catch-specific](./err-catch-specific.md)
- [err-custom-exceptions](./err-custom-exceptions.md)
