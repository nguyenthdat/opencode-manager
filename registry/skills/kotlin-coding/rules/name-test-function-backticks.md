# name-test-function-backticks

> Name test functions with backtick-quoted descriptive sentences

## Why It Matters

Kotlin allows arbitrary text (including spaces) in backtick-quoted identifiers, which lets test names read as full sentences describing behavior instead of cramped `camelCaseMethodNames`. Test reports (JUnit, Gradle, CI dashboards) render the function name verbatim, so a descriptive backtick name becomes readable documentation of what failed, without needing a separate `@DisplayName`.

## Bad

```kotlin
class UserServiceTest {
    @Test
    fun testCreateUser() { /* ... */ }

    @Test
    fun createUserFailsWhenEmailTaken() { /* ... */ }

    @Test
    fun test2() { /* ... */ }
}
```

## Good

```kotlin
class UserServiceTest {
    @Test
    fun `creating a user returns the persisted user with a generated id`() { /* ... */ }

    @Test
    fun `creating a user fails when the email is already taken`() { /* ... */ }

    @Test
    fun `creating a user with a blank name throws IllegalArgumentException`() { /* ... */ }
}
```

## Nested Grouping for Long Sentences

```kotlin
class OrderCalculatorTest {
    @Nested
    inner class `given a cart with a discount code` {
        @Test
        fun `applies the percentage discount to the subtotal`() { /* ... */ }

        @Test
        fun `ignores an expired discount code`() { /* ... */ }
    }
}
```

Combining `@Nested` classes (also backtick-named) with backtick test methods lets long test suites read like a spec document, each nested class narrowing the "given" context.

## Ktlint/Detekt Rule

Backtick function names are typically restricted to test source sets — `detekt`'s `naming.FunctionNaming` supports `ignoreAnnotated` so this convention doesn't leak into production code:

```yaml
naming:
  FunctionNaming:
    ignoreAnnotated: ['Test', 'ParameterizedTest']
```

## See Also

- [`test-descriptive-backtick-names`](test-descriptive-backtick-names.md) - the broader naming philosophy behind this convention
- [`test-junit5-annotations`](test-junit5-annotations.md) - `@Nested`/`@DisplayName` used alongside backtick names
- [`test-kotest-specs`](test-kotest-specs.md) - spec styles where descriptive strings replace function names entirely
