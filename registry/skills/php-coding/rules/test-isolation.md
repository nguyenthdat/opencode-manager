# test-isolation

> Tests must be independent and isolated

## Why It Matters

Tests that depend on each other or on shared state produce flaky results and are hard to debug. Each test must set up its own data and clean up after itself. The order of test execution should never matter.

## Bad

```php
<?php

declare(strict_types=1);

class OrderTest extends TestCase {
    private static int $orderId;

    public function testA_CreateOrder(): void {
        $order = Order::create(['total' => 100]);
        self::$orderId = $order->id; // Shared state
        $this->assertGreaterThan(0, $order->id);
    }

    /** @depends testA_CreateOrder */ // Depends on previous test
    public function testB_UpdateOrder(): void {
        $order = Order::find(self::$orderId); // Relies on testA
        $order->update(['total' => 200]);
        $this->assertSame(200.0, $order->total);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class OrderTest extends TestCase {
    use RefreshDatabase;

    public function testCreate_ValidData_ReturnsOrder(): void {
        $order = Order::create(['total' => 100]);
        $this->assertGreaterThan(0, $order->id);
        $this->assertSame(100.0, $order->total);
    }

    public function testUpdate_ExistingOrder_UpdatesTotal(): void {
        $order = Order::create(['total' => 100]); // Own setup
        $order->update(['total' => 200]);
        $this->assertSame(200.0, $order->fresh()->total);
    }

    public function testDelete_ExistingOrder_RemovesRecord(): void {
        $order = Order::create(['total' => 100]); // Own setup
        $order->delete();
        $this->assertNull(Order::find($order->id));
    }
}
```

## See Also

- [test-setup-teardown](./test-setup-teardown.md)
- [test-database-testing](./test-database-testing.md)
