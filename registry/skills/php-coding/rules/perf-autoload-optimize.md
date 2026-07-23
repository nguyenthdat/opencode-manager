# perf-autoload-optimize

> Run `composer dump-autoload -o` in production

## Why It Matters

Composer's optimized autoloader (`-o`) generates a classmap instead of relying on filesystem scans for PSR-4 resolution. This eliminates filesystem stat calls on every class load. Also consider `--apcu` for APCu-backed autoloading.

## Bad

```php
<?php

// composer install (development autoloader)
// composer install
// PSR-4: checks filesystem for every class load
```

## Good

```php
<?php

// composer install --optimize-autoloader --no-dev
// Generates classmap — O(1) class resolution

// Alternative: APCu autoloader (requires ext-apcu)
// composer install --apcu-autoloader

// composer.json — always optimize on install
{
    "config": {
        "optimize-autoloader": true,
        "apcu-autoloader": true
    }
}

// Build script
// composer install --no-dev --optimize-autoloader
// php artisan config:cache
// php artisan route:cache
// php artisan view:cache
```

## See Also

- [perf-opcache-enable](./perf-opcache-enable.md)
- [proj-composer-autoload](./proj-composer-autoload.md)
