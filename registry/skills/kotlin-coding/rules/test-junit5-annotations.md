# test-junit5-annotations

> Use JUnit 5 (`@Test`, `@Nested`, `@DisplayName`) idiomatically on the JVM

## Why It Matters

JUnit 5's `@Nested` and `@DisplayName` let you express hierarchical "given/when/then" structure and human-readable test reports without leaving plain JUnit — skipping them in favor of one flat class with dozens of `@Test` methods makes large suites hard to navigate and produces uninformative CI reports (`test3()` failed tells you nothing).

## Bad

```kotlin
class ShoppingCartTest {
    @Test
    fun test1() {
        val cart = ShoppingCart()
        cart.add(Item("apple", 1.0))
        assertEquals(1.0, cart.total)
    }

    @Test
    fun test2() {
        val cart = ShoppingCart()
        assertThrows(IllegalStateException::class.java) { cart.checkout() }
    }
}
```

## Good

```kotlin
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

@DisplayName("ShoppingCart")
class ShoppingCartTest {

    @Nested
    @DisplayName("when adding items")
    inner class AddingItems {
        @Test
        @DisplayName("increases the running total")
        fun `adding an item increases the total`() {
            val cart = ShoppingCart()
            cart.add(Item("apple", 1.0))
            assertEquals(1.0, cart.total)
        }
    }

    @Nested
    @DisplayName("when checking out")
    inner class CheckingOut {
        @Test
        @DisplayName("rejects an empty cart")
        fun `checkout on an empty cart throws`() {
            val cart = ShoppingCart()
            assertThrows<IllegalStateException> { cart.checkout() }
        }
    }
}
```

## Lifecycle Hooks

```kotlin
class DatabaseTest {
    private lateinit var connection: Connection

    @BeforeEach
    fun setUp() {
        connection = TestDatabase.newConnection()
    }

    @AfterEach
    fun tearDown() {
        connection.close()
    }

    @Test
    fun `insert then query returns the same row`() { /* ... */ }
}
```

Use `@BeforeEach`/`@AfterEach` for per-test setup rather than reusing shared mutable state across tests, and prefer JUnit 5's Kotlin extension `assertThrows<T> { }` (reified) over the Java-style `assertThrows(T::class.java) { }`.

## See Also

- [`name-test-function-backticks`](name-test-function-backticks.md) - naming style used alongside `@DisplayName`
- [`test-arrange-act-assert`](test-arrange-act-assert.md) - the structure inside each `@Test` method
- [`test-parameterized-tests`](test-parameterized-tests.md) - JUnit 5's `@ParameterizedTest` for input variants
