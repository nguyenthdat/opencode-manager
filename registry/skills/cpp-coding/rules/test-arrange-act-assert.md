# test-arrange-act-assert

> Structure tests as arrange/act/assert

## Why It Matters

Separating a test into a clear "set up the scenario," "perform the action under test," and "verify the outcome" structure makes it immediately obvious what's being tested and why it failed, even to a reader unfamiliar with the test. Interleaving setup, action, and assertions makes tests harder to scan and easier to accidentally break when refactoring.

## Bad

```cpp
TEST(ShoppingCartTest, AppliesDiscount) {
    ShoppingCart cart;
    cart.add_item("book", 20.0);
    EXPECT_EQ(cart.total(), 20.0);   // Assertion interleaved with setup...
    cart.apply_discount(0.1);
    cart.add_item("pen", 5.0);        // ...more setup after an assertion...
    EXPECT_NEAR(cart.total(), 22.5, 0.01);  // ...unclear what's actually being tested
}
```

## Good

```cpp
TEST(ShoppingCartTest, AppliesDiscountToTotal) {
    // Arrange
    ShoppingCart cart;
    cart.add_item("book", 20.0);
    cart.add_item("pen", 5.0);

    // Act
    cart.apply_discount(0.1);

    // Assert
    EXPECT_NEAR(cart.total(), 22.5, 0.01);
}
```

## One Logical Behavior per Test

```cpp
// Split into separate tests rather than asserting multiple unrelated
// behaviors in one test — each test name should describe exactly one thing:
TEST(ShoppingCartTest, AddingItemIncreasesTotal) { /* ... */ }
TEST(ShoppingCartTest, ApplyingDiscountReducesTotal) { /* ... */ }
TEST(ShoppingCartTest, RemovingItemDecreasesTotal) { /* ... */ }
```

## See Also

- [test-descriptive-names](test-gtest-fixtures.md) - Naming tests to describe the single behavior under test
- [test-gtest-fixtures](test-gtest-fixtures.md) - Extracting shared "arrange" logic into a fixture
- [test-catch2-sections](test-catch2-sections.md) - `SECTION`-based given/when/then structuring
