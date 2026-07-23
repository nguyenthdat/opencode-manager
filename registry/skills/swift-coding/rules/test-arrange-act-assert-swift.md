# test-arrange-act-assert-swift

> Structure tests as arrange/act/assert

## Why It Matters

A test that interleaves setup, invocation, and assertions is hard to skim and hard to debug on failure—the reader must reconstruct which lines were preconditions versus which line actually exercised the behavior under test. Visually separating Arrange, Act, and Assert (even just with blank lines or comments) makes each test's intent immediately clear and keeps tests short enough to review at a glance.

## Bad

```swift
import Testing

struct ShoppingCartTests {
    @Test
    func discountApplied() {
        var cart = ShoppingCart()
        cart.add(Item(name: "Book", price: 20))
        #expect(cart.items.count == 1)
        cart.applyDiscount(percent: 10)
        cart.add(Item(name: "Pen", price: 5))
        #expect(cart.total == 22.5) // assertions and actions tangled together
    }
}
```

## Good

```swift
import Testing

struct ShoppingCartTests {
    @Test
    func discountAppliesToItemsAddedBeforeIt() {
        // Arrange
        var cart = ShoppingCart()
        cart.add(Item(name: "Book", price: 20))

        // Act
        cart.applyDiscount(percent: 10)

        // Assert
        #expect(cart.total == 18)
    }

    @Test
    func itemsAddedAfterDiscountAreNotDiscounted() {
        // Arrange
        var cart = ShoppingCart()
        cart.add(Item(name: "Book", price: 20))
        cart.applyDiscount(percent: 10)

        // Act
        cart.add(Item(name: "Pen", price: 5))

        // Assert
        #expect(cart.total == 23) // 18 (discounted) + 5 (full price)
    }
}
```

## One Behavior per Test

```swift
// Splitting the two behaviors above into separate tests (rather than one test
// with multiple unrelated assertions) keeps each Arrange/Act/Assert block
// focused, and a failure immediately identifies which behavior broke.
import Testing

struct AccountBalanceTests {
    @Test
    func depositIncreasesBalance() {
        var account = Account(balance: 100)
        account.deposit(50)
        #expect(account.balance == 150)
    }

    @Test
    func withdrawalDecreasesBalance() {
        var account = Account(balance: 100)
        account.withdraw(30)
        #expect(account.balance == 70)
    }
}
```

## See Also

- [`test-descriptive-test-names`](test-descriptive-test-names.md) - Naming each Act/Assert clearly
- [`test-fixture-setup-teardown`](test-fixture-setup-teardown.md) - Moving repeated Arrange steps out
- [`test-swift-testing-macro`](test-swift-testing-macro.md) - `@Test`/`#expect` basics
