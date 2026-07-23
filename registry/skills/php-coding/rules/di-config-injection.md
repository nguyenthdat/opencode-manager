# di-config-injection

> Inject config values, don't read `config()` directly

## Why It Matters

Reading configuration from a global helper couples code to the framework's config system, making it impossible to reuse in a different context. Inject specific config values (primitives or DTOs) so the class is self-contained and testable.

## Bad

```php
<?php

declare(strict_types=1);

class ApiClient {
    private string $baseUrl;
    private int $timeout;

    public function __construct() {
        $this->baseUrl = config('services.api.url');
        $this->timeout = config('services.api.timeout', 30);
    }

    public function request(string $endpoint): array { /* ... */ }
}
```

## Good

```php
<?php

declare(strict_types=1);

class ApiClient {
    public function __construct(
        private string $baseUrl,
        private int $timeout = 30,
    ) {}

    public function request(string $endpoint): array { /* ... */ }
}

// Service provider injects config values
$this->app->bind(ApiClient::class, fn($app) => new ApiClient(
    baseUrl: $app['config']['services.api.url'],
    timeout: (int) $app['config']['services.api.timeout'],
));

// Test with explicit values
$client = new ApiClient('https://test.example.com', 5);
```

## See Also

- [di-container-binding](./di-container-binding.md)
- [di-testability-first](./di-testability-first.md)
