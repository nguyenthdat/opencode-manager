# test-assertk-fluent-assertions

> Use fluent assertion libraries (`assertk`, Kotest matchers) over raw JUnit asserts

## Why It Matters

Raw `assertEquals(expected, actual)` failure messages just dump both values with no context, and asserting on multiple properties of an object requires several separate lines with no shared subject. Fluent assertions (`assertThat(result).isEqualTo(...)`) read like natural language, chain multiple checks against the same subject, and produce far more actionable failure messages, including structural diffs for collections and data classes.

## Bad

```kotlin
@Test
fun `parses a valid order`() {
    val order = OrderParser.parse(rawJson)
    assertNotNull(order)
    assertEquals("ord_1", order!!.id)
    assertEquals(3, order.items.size)
    assertTrue(order.items.all { it.quantity > 0 })
}
```

## Good

```kotlin
import assertk.assertThat
import assertk.assertions.*

@Test
fun `parses a valid order`() {
    val order = OrderParser.parse(rawJson)

    assertThat(order).isNotNull().given { o ->
        assertThat(o.id).isEqualTo("ord_1")
        assertThat(o.items).hasSize(3)
        assertThat(o.items).each { it.transform { item -> item.quantity }.isGreaterThan(0) }
    }
}
```

## Kotest Matchers as an Alternative

```kotlin
import io.kotest.matchers.shouldBe
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.nulls.shouldNotBeNull

@Test
fun `parses a valid order`() {
    val order = OrderParser.parse(rawJson).shouldNotBeNull()
    order.id shouldBe "ord_1"
    order.items shouldHaveSize 3
}
```

## Readable Failure Output

```
expected [order.items] to have size:<3> but was size:<2>
  Actual([Item(book, 20.0, 1), Item(pen, 2.0, 1)])
```

A fluent assertion failure names the exact sub-property that diverged (`order.items`) instead of a bare `expected:<3> but was:<2>`, which matters most once assertions are chained several levels deep into nested objects.

## See Also

- [`test-kotest-specs`](test-kotest-specs.md) - Kotest's own matcher library used within its spec styles
- [`test-arrange-act-assert`](test-arrange-act-assert.md) - where the assert phase benefits most from fluent chains
- [`test-descriptive-backtick-names`](test-descriptive-backtick-names.md) - pairing readable assertions with readable test names
