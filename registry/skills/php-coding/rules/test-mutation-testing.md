# test-mutation-testing

> Run Infection for mutation testing on critical paths

## Why It Matters

Mutation testing deliberately introduces bugs (mutations) to verify that tests catch them. If a mutation survives (tests still pass), your test suite has a gap. Run Infection on business-critical code to validate test quality beyond line coverage.

## Bad

```php
<?php

declare(strict_types=1);

// No mutation testing — coverage says 90% but are tests meaningful?
// vendor/bin/phpunit --coverage-text
// Classes: 90% (feels safe)

// Only line coverage — no quality metric
```

## Good

```php
<?php

declare(strict_types=1);

// infection.json5
{
    "$schema": "vendor/infection/infection/resources/schema.json",
    "source": {
        "directories": ["src"]
    },
    "mutators": {
        "@default": true,
        "@function_signature": false
    },
    "logs": {
        "text": "infection.log",
        "html": "infection.html"
    },
    "minMsi": 85,
    "minCoveredMsi": 90
}

// Run
// vendor/bin/infection

// Output:
// 120 mutations generated
// 102 mutations were killed (85%)
// 18 mutations were not covered by tests

// CI enforcement
// vendor/bin/infection --min-msi=85 --min-covered-msi=90
```

## See Also

- [test-coverage-target](./test-coverage-target.md)
- [test-arrange-act-assert](./test-arrange-act-assert.md)
