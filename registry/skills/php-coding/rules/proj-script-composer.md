# proj-script-composer

> Use Composer scripts for build/test tasks

## Why It Matters

Composer scripts standardize project commands — every developer uses the same commands regardless of their local tooling. Define scripts for testing, linting, formatting, and CI pipeline steps.

## Bad

```php
<?php

// No standard commands — everyone does something different
// Developer A: php vendor/bin/phpunit
// Developer B: ./vendor/bin/phpunit tests/
// Developer C: phpunit (global install — different version)
// CI: vendor/bin/phpunit --coverage-text
```

## Good

```php
<?php

{
    "scripts": {
        "test": "phpunit",
        "test:coverage": "phpunit --coverage-html coverage",
        "test:unit": "phpunit --testsuite Unit",
        "test:feature": "phpunit --testsuite Feature",
        "lint": "phpstan analyse --memory-limit=256M",
        "lint:baseline": "phpstan analyse --generate-baseline",
        "format": "pint",
        "format:check": "pint --test",
        "check": [
            "@lint",
            "@format:check",
            "@test"
        ],
        "post-install-cmd": [
            "@php artisan optimize:clear"
        ],
        "post-update-cmd": [
            "@php artisan optimize:clear"
        ]
    }
}

// Everyone runs the same:
// composer test
// composer lint
// composer format
// composer check
```

## See Also

- [proj-composer-autoload](./proj-composer-autoload.md)
- [lint-php-cs-fixer](./lint-php-cs-fixer.md)
