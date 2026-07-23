# test-factories-over-fixtures

> Use model factories over hardcoded fixtures

## Why It Matters

Model factories generate test data with sensible defaults, making tests concise and resilient to schema changes. Hardcoded fixtures break when a required column is added. Factories adapt to schema changes automatically.

## Bad

```php
<?php

declare(strict_types=1);

class PaymentTest extends TestCase {
    public function testProcess(): void {
        // Hardcoded fixture — breaks if schema changes
        DB::table('users')->insert([
            'id' => 1, 'name' => 'John', 'email' => 'john@example.com',
            'password' => 'hash', 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('orders')->insert([
            'id' => 1, 'user_id' => 1, 'total' => 100.0,
            'status' => 'pending', 'created_at' => now(),
        ]);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class PaymentTest extends TestCase {
    use RefreshDatabase;

    public function testProcess_ValidOrder_ChargesPayment(): void {
        $user = User::factory()->create();
        $order = Order::factory()
            ->for($user)
            ->state(['total' => 100.0, 'status' => 'pending'])
            ->create();

        $result = PaymentService::process($order);

        $this->assertSame('success', $result->status);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'paid']);
    }

    public function testProcess_ExpiredOrder_ThrowsException(): void {
        $order = Order::factory()->expired()->create();
        $this->expectException(OrderExpiredException::class);
        PaymentService::process($order);
    }
}
```

## See Also

- [test-database-testing](./test-database-testing.md)
- [test-isolation](./test-isolation.md)
