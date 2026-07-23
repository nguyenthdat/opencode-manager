# test-coverage-target

> Aim for 80%+ coverage on business logic

## Why It Matters

Code coverage identifies untested code paths. While 100% coverage doesn't guarantee bug-free code, <80% indicates significant gaps. Prioritize coverage on business logic, not boilerplate (getters/setters). Use `@codeCoverageIgnore` for noise reduction.

## Bad

```php
<?php

declare(strict_types=1);

// phpunit.xml — no coverage configuration
<phpunit>
    <testsuites>
        <testsuite name="Unit"><directory>tests/Unit</directory></testsuite>
    </testsuites>
</phpunit>
```

## Good

```php
<?php

declare(strict_types=1);

// phpunit.xml — with coverage
<phpunit>
    <testsuites>
        <testsuite name="Unit"><directory>tests/Unit</directory></testsuite>
    </testsuites>
    <source>
        <include>
            <directory suffix=".php">src/</directory>
        </include>
        <exclude>
            <directory>src/Migrations</directory>
        </exclude>
    </source>
    <coverage>
        <report>
            <html outputDirectory="coverage"/>
            <text outputFile="php://stdout"/>
            <clover outputFile="coverage.xml"/>
        </report>
    </coverage>
</phpunit>

// Run with coverage
// vendor/bin/phpunit --coverage-html coverage

// Ignore noise
class User {
    /** @codeCoverageIgnore */
    public function getName(): string { return $this->name; }
}

// Enforce minimum coverage in CI
// vendor/bin/phpunit --coverage-text --min-coverage=80
```

## See Also

- [test-arrange-act-assert](./test-arrange-act-assert.md)
- [test-data-providers](./test-data-providers.md)
