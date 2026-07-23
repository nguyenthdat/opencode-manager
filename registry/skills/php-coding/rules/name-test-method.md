# name-test-method

> Test method: `test{Method}_{Scenario}`

## Why It Matters

Descriptive test names document the expected behavior. The format `test{Method}_{Scenario}` makes test output immediately understandable — you can identify what broke without reading the test code.

## Bad

```php
<?php

declare(strict_types=1);

class OrderTest extends TestCase {
    public function test1() {}        // What does this test?
    public function testOrder() {}    // What about orders?
    public function testProcess() {}  // What scenario?

    public function it_processes_order() {}
```

## Good

```php
<?php

declare(strict_types=1);

class OrderTest extends TestCase {
    public function testProcess_ValidOrder_ReturnsSuccess(): void {}
    public function testProcess_EmptyCart_ThrowsException(): void {}
    public function testProcess_InvalidPayment_ReturnsError(): void {}
    public function testCancel_AlreadyShipped_ThrowsException(): void {}

    // Pest style
    it('processes a valid order successfully', function () {});
    it('throws exception when cart is empty', function () {});
    it('returns error for invalid payment', function () {});
}
```

## See Also

- [test-phpunit-pest](./test-phpunit-pest.md)
- [test-arrange-act-assert](./test-arrange-act-assert.md)
