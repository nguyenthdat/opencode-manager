# proj-config-cache

> Cache config in production (`php artisan config:cache`)

## Why It Matters

Laravel reads dozens of config files on every request. Config caching merges them into a single file, significantly reducing bootstrap time. Always cache config, routes, and views in production.

## Bad

```php
<?php

// No caching — every request reads all config files
// Deploy:
// git pull
// composer install
// Done — slow bootstrap
```

## Good

```php
<?php

// Deployment script — cache everything
php artisan config:cache      // Merge all config into one file
php artisan route:cache       // Serialize route definitions
php artisan view:cache        // Precompile Blade templates
php artisan event:cache       // Cache event-to-listener mappings

// On config change, clear and re-cache
php artisan config:clear
php artisan config:cache

// In production, config() reads from cache, not files
// Don't use env() outside config files — env() returns null when config is cached
```

## See Also

- [proj-env-example](./proj-env-example.md)
- [perf-opcache-enable](./perf-opcache-enable.md)
