# oop-builder-pattern

> Use Builder for multi-step object construction

## Why It Matters

When an object requires many configuration options or a multi-step build process, the Builder pattern provides a fluent, readable API. It avoids constructors with many parameters and separates construction logic from the object's runtime behavior.

## Bad

```php
<?php

declare(strict_types=1);

class HttpClient {
    public function __construct(
        string $baseUrl, int $timeout, int $maxRetries, ?string $proxy,
        ?array $headers, ?callable $middleware, bool $verifySsl, string $certPath,
    ) { /* ... */ }
}

$client = new HttpClient('https://api.example.com', 30, 3, null, ['Authorization' => 'Bearer token'], null, true, '/etc/ssl/cert.pem');
```

## Good

```php
<?php

declare(strict_types=1);

class HttpClient {
    private function __construct(
        public readonly string $baseUrl, public readonly int $timeout,
        public readonly int $maxRetries, public readonly ?string $proxy,
        public readonly array $headers, public readonly bool $verifySsl,
    ) {}

    public static function builder(): HttpClientBuilder { return new HttpClientBuilder(); }
}

class HttpClientBuilder {
    private string $baseUrl;
    private int $timeout = 30;
    private int $maxRetries = 3;
    private ?string $proxy = null;
    private array $headers = [];
    private bool $verifySsl = true;

    public function baseUrl(string $url): self { $this->baseUrl = $url; return $this; }
    public function timeout(int $seconds): self { $this->timeout = $seconds; return $this; }
    public function retry(int $maxRetries): self { $this->maxRetries = $maxRetries; return $this; }
    public function withHeader(string $key, string $value): self { $this->headers[$key] = $value; return $this; }

    public function build(): HttpClient {
        if (!isset($this->baseUrl)) throw new \RuntimeException('baseUrl is required');
        return new HttpClient($this->baseUrl, $this->timeout, $this->maxRetries, $this->proxy, $this->headers, $this->verifySsl);
    }
}

$client = HttpClient::builder()->baseUrl('https://api.example.com')->timeout(10)->retry(5)->withHeader('Authorization', 'Bearer token')->build();
```

## See Also

- [oop-factory-method](./oop-factory-method.md)
- [oop-fluent-interface](./oop-fluent-interface.md)
