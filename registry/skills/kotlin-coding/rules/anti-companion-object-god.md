# anti-companion-object-god

> Don't turn a companion object into a dumping ground of unrelated statics

## Why It Matters

A companion object is scoped to its enclosing class, so when it accumulates constants, factory functions, and utility helpers that have nothing to do with each other (or with the class itself), it becomes a junk drawer that's hard to navigate, hard to test independently, and signals that several unrelated concerns should have been separated into their own types or top-level declarations.

## Bad

```kotlin
class UserRepository(private val db: Database) {
    fun find(id: String): User? = db.query(id)

    companion object {
        const val TABLE_NAME = "users"
        const val MAX_RETRIES = 3
        const val DATE_FORMAT = "yyyy-MM-dd" // unrelated to UserRepository specifically
        const val API_BASE_URL = "https://api.example.com" // wholly unrelated

        fun formatDate(epochMillis: Long): String = /* ... */ error("unimplemented") // utility, not a factory
        fun validateEmail(email: String): Boolean = /* ... */ error("unimplemented") // unrelated concern
        fun create(db: Database): UserRepository = UserRepository(db)
    }
}
```

## Good

```kotlin
class UserRepository(private val db: Database) {
    fun find(id: String): User? = db.query(id, table = TABLE_NAME)

    companion object {
        // Only what's genuinely intrinsic to UserRepository: its own
        // constants and its own factory function
        const val TABLE_NAME = "users"
        private const val MAX_RETRIES = 3

        fun create(db: Database): UserRepository = UserRepository(db)
    }
}

object DateFormatting {
    private const val PATTERN = "yyyy-MM-dd"
    fun format(epochMillis: Long): String = /* ... */ error("unimplemented")
}

object EmailValidator {
    fun isValid(email: String): Boolean = /* ... */ error("unimplemented")
}

object ApiConfig {
    const val BASE_URL = "https://api.example.com"
}
```

## When It's Still Sometimes Seen

A companion object holding a handful of tightly related constants (`DEFAULT_TIMEOUT`, `DEFAULT_PAGE_SIZE`) plus one or two factory functions (`fun of(...)`, `fun empty()`) for the *same* class is the intended, idiomatic use — the anti-pattern is specifically unrelated concerns accumulating there because it was convenient, not because they belong.

## See Also

- [`type-companion-factory`](type-companion-factory.md) - the positive-framed rule for what belongs in a companion object
- [`anti-god-object`](anti-god-object.md) - the same accumulation problem at the class level
- [`type-data-object-singleton`](type-data-object-singleton.md) - prefer a `data object` over a companion for a genuine singleton
