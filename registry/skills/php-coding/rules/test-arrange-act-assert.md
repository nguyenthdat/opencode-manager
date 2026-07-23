# test-arrange-act-assert

> Structure tests: arrange, act, assert

## Why It Matters

The Arrange-Act-Assert pattern makes tests readable and maintainable. Arrange sets up the test data, Act executes the code under test, Assert verifies the result. Separate these phases with blank lines.

## Bad

```php
<?php

declare(strict_types=1);

class OrderTest extends TestCase {
    public function testCalculateTotal(): void {
        $order = new Order();
        $order->addItem(new Item('Widget', 10.0, 2));
        $this->assertSame(20.0, $order->calculateTotal());
        $order->addItem(new Item('Gadget', 5.0, 1));
        $this->assertSame(25.0, $order->calculateTotal()); // Mixed phases
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class OrderTest extends TestCase {
    public function testCalculateTotal_WithMultipleItems_ReturnsSum(): void {
        // Arrange
        $order = new Order();
        $order->addItem(new Item('Widget', 10.0, 2));
        $order->addItem(new Item('Gadget', 5.0, 1));

        // Act
        $total = $order->calculateTotal();

        // Assert
        $this->assertSame(25.0, $total);
    }

    public function testCalculateTotal_EmptyOrder_ReturnsZero(): void {
        // Arrange
        $order = new Order();

        // Act
        $total = $order->calculateTotal();

        // Assert
        $this->assertSame(0.0, $total);
    }
}
```

## See Also

- [test-isolation](./test-isolation.md)
- [name-test-method](./name-test-method.md)
