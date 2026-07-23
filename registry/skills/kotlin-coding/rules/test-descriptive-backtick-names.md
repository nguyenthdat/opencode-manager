# test-descriptive-backtick-names

> Write descriptive test names, not `test1`/`testFoo`

## Why It Matters

A test suite is a living specification — `test1` or `testFoo` tells a future maintainer (or a CI failure notification) nothing about what broke or why it matters, forcing them to open the source to understand the failure. A name like `` `withdrawal fails when amount exceeds balance` `` communicates the requirement being verified without reading a single line of the test body.

## Bad

```kotlin
class AccountTest {
    @Test
    fun test1() {
        val account = Account(balance = 100.0)
        assertThrows<InsufficientFundsException> { account.withdraw(150.0) }
    }

    @Test
    fun testWithdraw() {
        val account = Account(balance = 100.0)
        account.withdraw(50.0)
        assertEquals(50.0, account.balance)
    }
}
```

## Good

```kotlin
class AccountTest {
    @Test
    fun `withdrawal throws InsufficientFundsException when amount exceeds balance`() {
        val account = Account(balance = 100.0)
        assertThrows<InsufficientFundsException> { account.withdraw(150.0) }
    }

    @Test
    fun `withdrawal reduces the balance by the withdrawn amount`() {
        val account = Account(balance = 100.0)
        account.withdraw(50.0)
        assertEquals(50.0, account.balance)
    }
}
```

## A Naming Template

```kotlin
// "<unit under test> <does X> when <condition>"
fun `parseDate returns null when the input is not ISO-8601`() { /* ... */ }

// "<action> <expected outcome>"
fun `submitting an empty form disables the submit button`() { /* ... */ }
```

Stick to one template across the codebase (subject-first or condition-first) so test names are scannable as a group, not just individually readable.

## What Not to Encode in the Name

```kotlin
// Avoid restating implementation details that will go stale
fun `withdraw calls repository dot save once`() { /* brittle: couples the name to internals */ }

// Prefer describing observable behavior instead
fun `withdrawal persists the updated balance`() { /* ... */ }
```

## See Also

- [`name-test-function-backticks`](name-test-function-backticks.md) - the backtick syntax this convention relies on
- [`test-arrange-act-assert`](test-arrange-act-assert.md) - structuring the test body the name describes
- [`test-junit5-annotations`](test-junit5-annotations.md) - `@DisplayName` as a complementary reporting mechanism
