# di-deferred-providers

> Use deferred service providers for lazy loading

## Why It Matters

Deferred service providers only load when their binding is actually needed, improving application boot time. Register providers that aren't needed on every request as deferred — the container will load them on demand.

## Bad

```php
<?php

declare(strict_types=1);

class PdfServiceProvider extends ServiceProvider {
    public function register(): void {
        $this->app->bind(PdfGeneratorInterface::class, WkhtmltopdfGenerator::class);
    }
}

// config/app.php — always loaded
'providers' => [PdfServiceProvider::class],
```

## Good

```php
<?php

declare(strict_types=1);

class PdfServiceProvider extends ServiceProvider {
    protected bool $defer = true;

    public function register(): void {
        $this->app->bind(PdfGeneratorInterface::class, WkhtmltopdfGenerator::class);
    }

    /** @return array<class-string> */
    public function provides(): array {
        return [PdfGeneratorInterface::class];
    }
}

// Provider loads only when PdfGeneratorInterface is first resolved
$pdf = app(PdfGeneratorInterface::class); // Provider boots here
```

## See Also

- [di-container-binding](./di-container-binding.md)
- [perf-autoload-optimize](./perf-autoload-optimize.md)
