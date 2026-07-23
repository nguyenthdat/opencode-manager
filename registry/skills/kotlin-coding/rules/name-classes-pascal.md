# name-classes-pascal

> Use `PascalCase` for classes, interfaces, and objects

## Why It Matters

Kotlin's official style guide mandates PascalCase for all type declarations. Inconsistent casing forces readers to context-switch between naming schemes, breaks IDE auto-complete heuristics that group by case, and makes it harder to visually distinguish a type reference from a function call or a value. Tooling like ktlint and detekt flag violations by default, so inconsistent casing also creates constant lint noise.

## Bad

```kotlin
class userRepository {
    fun findUser(id: Long): user? = null
}

interface data_source {
    fun connect()
}

object connection_pool
```

## Good

```kotlin
class UserRepository {
    fun findUser(id: Long): User? = null
}

interface DataSource {
    fun connect()
}

object ConnectionPool
```

## Nested and Sealed Types

```kotlin
sealed interface PaymentResult {
    data class Success(val transactionId: String) : PaymentResult
    data class Failure(val reason: String) : PaymentResult
    data object Pending : PaymentResult
}
```

Nested classes, sealed subtypes, and `object` declarations all follow the same PascalCase rule as their enclosing type — there is no separate convention for "inner" types.

## Ktlint/Detekt Rule

`detekt`'s `naming.ClassNaming` rule (and ktlint's `standard:class-naming`) enforce this by default with the pattern `[A-Z][a-zA-Z0-9]*`:

```yaml
naming:
  ClassNaming:
    classPattern: '[A-Z][a-zA-Z0-9]*'
```

## See Also

- [`name-functions-camel`](name-functions-camel.md) - the complementary convention for members
- [`name-packages-lowercase`](name-packages-lowercase.md) - casing rule for the enclosing package
- [`name-acronyms-as-words`](name-acronyms-as-words.md) - how acronyms interact with PascalCase
- [`name-enum-entries-screaming-or-pascal`](name-enum-entries-screaming-or-pascal.md) - casing for enum constants
