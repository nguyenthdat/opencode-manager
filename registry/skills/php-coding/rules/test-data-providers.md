# test-data-providers

> Use `@dataProvider` for parameterized tests

## Why It Matters

Data providers let you run the same test logic with multiple input sets, reducing code duplication. Each dataset is a separate test case in the output. This is more maintainable than copy-pasting test methods.

## Bad

```php
<?php

declare(strict_types=1);

class ValidationTest extends TestCase {
    public function testValidateEmail_ValidEmail_ReturnsTrue(): void {
        $this->assertTrue(Validator::email('user@example.com'));
    }
    public function testValidateEmail_ValidEmailWithSubdomain_ReturnsTrue(): void {
        $this->assertTrue(Validator::email('user@sub.example.com'));
    }
    public function testValidateEmail_MissingAt_ReturnsFalse(): void {
        $this->assertFalse(Validator::email('userexample.com'));
    }
    public function testValidateEmail_EmptyString_ReturnsFalse(): void {
        $this->assertFalse(Validator::email(''));
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class ValidationTest extends TestCase {
    /** @dataProvider emailProvider */
    public function testValidateEmail(string $email, bool $expected): void {
        $this->assertSame($expected, Validator::email($email));
    }

    public static function emailProvider(): array {
        return [
            'valid basic' => ['user@example.com', true],
            'valid subdomain' => ['user@sub.example.com', true],
            'valid plus tag' => ['user+tag@example.com', true],
            'missing @' => ['userexample.com', false],
            'empty string' => ['', false],
            'missing domain' => ['user@', false],
        ];
    }
}
```

## See Also

- [test-arrange-act-assert](./test-arrange-act-assert.md)
- [test-isolation](./test-isolation.md)
