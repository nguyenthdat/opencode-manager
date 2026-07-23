# lint-strict-rules

> Enable strict rules in PHPStan/Psalm

## Why It Matters

Strict rules surface hidden bugs: unused parameters, impossible type checks, unreachable code. These rules are opinionated but catch real issues. Enable them incrementally as your codebase matures.

## Bad

```php
<?php

// phpstan.neon — basic, no strict rules
parameters:
    level: 5
    paths:
        - src

// Missing: strict rules, bleeding edge
```

## Good

```php
<?php

// phpstan.neon — with strict rules
parameters:
    level: 8
    paths:
        - src
    treatPhpDocTypesAsCertain: false
    checkMissingIterableValueType: true
    checkGenericClassInNonGenericObjectType: true

includes:
    - vendor/phpstan/phpstan-strict-rules/rules.neon

// Additional strict extensions
// composer require --dev phpstan/phpstan-strict-rules
// composer require --dev phpstan/phpstan-deprecation-rules
// composer require --dev phpstan/phpstan-phpunit

// Bleeding edge — future rules
parameters:
    phpVersion: 80300
    reportUnmatchedIgnoredErrors: false
    featureToggles:
        bleedingEdge: true
```

## See Also

- [lint-phpstan-level](./lint-phpstan-level.md)
- [lint-native-type-hints](./lint-native-type-hints.md)
