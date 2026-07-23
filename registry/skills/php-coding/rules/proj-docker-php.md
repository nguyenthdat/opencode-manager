# proj-docker-php

> Provide Dockerfile for consistent PHP environment

## Why It Matters

A Dockerfile ensures all developers and CI run the same PHP version with the same extensions. It eliminates 'works on my machine' issues. Use multi-stage builds for small production images.

## Bad

```php
<?php

// No Docker setup — environment inconsistencies
// Dev: PHP 8.3 with XDebug on macOS
// CI: PHP 8.2 without XDebug on Ubuntu
// Production: PHP 8.1 with different extensions
// "Works on my machine" — but not in production
```

## Good

```php
Dockerfile
FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    libpng-dev \
    libzip-dev \
    oniguruma-dev

RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    zip \
    opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --optimize-autoloader

COPY . .
RUN composer dump-autoload --optimize

RUN php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

EXPOSE 9000
CMD ["php-fpm"]
```

## See Also

- [proj-config-cache](./proj-config-cache.md)
- [perf-opcache-enable](./perf-opcache-enable.md)
