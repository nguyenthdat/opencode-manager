# test-arrange-act-assert

> Structure tests as arrange/act/assert

## Why It Matters

A test that interleaves setup, invocation, and assertions makes it hard to tell what's actually being tested versus what's just plumbing — readers have to mentally reconstruct the three phases anyway. Explicitly separating arrange/act/assert (also called given/when/then) turns every test into a predictable, skimmable shape, which pays off enormously once a suite has hundreds of tests.

## Bad

```kotlin
@Test
fun `applying a coupon reduces the total`() {
    val cart = Cart()
    cart.add(Item("book", 20.0))
    assertEquals(20.0, cart.total)
    cart.applyCoupon(Coupon("SAVE10", percentOff = 10))
    assertEquals(18.0, cart.total)
    cart.add(Item("pen", 2.0))
    assertEquals(19.8, cart.total, 0.001)
}
```

## Good

```kotlin
@Test
fun `applying a coupon reduces the total by the discount percentage`() {
    // Arrange
    val cart = Cart().apply {
        add(Item("book", 20.0))
    }

    // Act
    cart.applyCoupon(Coupon("SAVE10", percentOff = 10))

    // Assert
    assertEquals(18.0, cart.total, 0.001)
}
```

## One Behavior per Test

```kotlin
@Test
fun `adding an item after a coupon is applied still gets the discount`() {
    // Arrange
    val cart = Cart().apply {
        add(Item("book", 20.0))
        applyCoupon(Coupon("SAVE10", percentOff = 10))
    }

    // Act
    cart.add(Item("pen", 2.0))

    // Assert
    assertEquals(19.8, cart.total, 0.001)
}
```

Splitting the original test into two — one for the coupon discount, one for adding an item after a coupon — keeps each test's "act" and "assert" focused on a single behavior, so a failure immediately tells you what broke.

## Blank-Line Convention

Some teams skip the `// Arrange` / `// Act` / `// Assert` comments once the pattern is habitual, relying on a blank line between each phase instead — pick whichever your team's style guide prefers and apply it consistently.

## See Also

- [`test-descriptive-backtick-names`](test-descriptive-backtick-names.md) - naming the single behavior each test's act/assert covers
- [`test-fixture-builders`](test-fixture-builders.md) - keeping the arrange phase concise
- [`test-kotest-specs`](test-kotest-specs.md) - `given`/`when`/`then` as this pattern built into the framework
