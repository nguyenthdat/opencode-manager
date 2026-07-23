# test-fixture-builders

> Use builder/factory functions to construct test fixtures

## Why It Matters

Constructing a complex domain object inline in every test — spelling out all constructor arguments even when only one matters to that test — makes tests brittle (adding a required constructor parameter breaks every test file) and buries the one field that actually matters under boilerplate. A builder/factory function with sensible defaults lets each test override only the fields relevant to it.

## Bad

```kotlin
@Test
fun `applies free shipping over 50 dollars`() {
    val order = Order(
        id = "ord_1",
        customerId = "cust_1",
        items = listOf(Item("book", 20.0, quantity = 1)),
        subtotal = 60.0,
        shippingAddress = Address("1 Main St", "Springfield", "12345", "US"),
        placedAt = Instant.parse("2024-01-01T00:00:00Z"),
        status = OrderStatus.PENDING,
    )
    assertTrue(ShippingCalculator.isFree(order))
}
```

## Good

```kotlin
fun testOrder(
    subtotal: Double = 60.0,
    items: List<Item> = listOf(Item("book", 20.0, quantity = 1)),
    status: OrderStatus = OrderStatus.PENDING,
) = Order(
    id = "ord_1",
    customerId = "cust_1",
    items = items,
    subtotal = subtotal,
    shippingAddress = Address("1 Main St", "Springfield", "12345", "US"),
    placedAt = Instant.parse("2024-01-01T00:00:00Z"),
    status = status,
)

@Test
fun `applies free shipping over 50 dollars`() {
    val order = testOrder(subtotal = 60.0)
    assertTrue(ShippingCalculator.isFree(order))
}

@Test
fun `charges shipping under 50 dollars`() {
    val order = testOrder(subtotal = 30.0)
    assertFalse(ShippingCalculator.isFree(order))
}
```

## DSL-Style Builders for Nested Fixtures

```kotlin
class OrderBuilder {
    var subtotal: Double = 60.0
    private val items = mutableListOf<Item>()

    fun item(name: String, price: Double, quantity: Int = 1) {
        items += Item(name, price, quantity)
    }

    fun build() = Order(id = "ord_1", customerId = "cust_1", items = items, subtotal = subtotal, /* ... */)
}

fun testOrder(block: OrderBuilder.() -> Unit = {}): Order = OrderBuilder().apply(block).build()

val order = testOrder {
    item("book", 20.0)
    subtotal = 20.0
}
```

## See Also

- [`test-parameterized-tests`](test-parameterized-tests.md) - fixtures as rows in a parameterized table
- [`api-dsl-lambda-receiver`](api-dsl-lambda-receiver.md) - the receiver-lambda pattern behind DSL-style builders
- [`api-copy-with-defaults`](api-copy-with-defaults.md) - `data class copy()` as a lighter-weight fixture variant
