# test-no-only

> Never commit `$this->markTestIncomplete()` or `->only()`

## Why It Matters

`->only()` runs a single test and skips all others — if committed, CI only runs one test. `markTestIncomplete()` passes silently, hiding missing tests. Both are development-only tools. Use git hooks or lint rules to prevent commits containing them.

## Bad

```php
<?php

declare(strict_types=1);

class PaymentTest extends TestCase {
    /** @test */
    public function it_processes_payment(): void {
        // Only this test runs in CI
    }
}

// pest
it('processes payment', function () {})->only();

class ReportTest extends TestCase {
    public function testExport(): void {
        $this->markTestIncomplete('Not implemented yet');
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class PaymentTest extends TestCase {
    public function testProcess_ValidPayment_ReturnsSuccess(): void {
        // All tests run
    }

    public function testProcess_InvalidPayment_ThrowsException(): void {
        // All tests run
    }
}

// PHPStan/Pint rule to catch ->only()
// pint.json
{
    "rules": {
        "no_debug_code": true
    }
}

// Use @group for selective running in development
class PaymentTest extends TestCase {
    /** @group wip */
    public function testProcess_NewFeature(): void {}
}
// vendor/bin/phpunit --group wip
```

## See Also

- [lint-no-debug-code](./lint-no-debug-code.md)
- [test-coverage-target](./test-coverage-target.md)
