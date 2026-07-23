# name-constants-UPPER_SNAKE

> `UPPER_SNAKE_CASE` for constants (`static final`)

## Why It Matters

`UPPER_SNAKE_CASE` visually distinguishes compile-time constants from variables and methods. It signals immutability and makes magic numbers/strings easily identifiable. This is a universal JVM convention that every developer recognizes immediately.

## Bad

```groovy
class AppConfig {
    static final int maxRetries = 3          // camelCase — looks mutable
    static final String defaultHost = 'localhost'
    static final int connectionTimeoutMs = 5000
}

def max = AppConfig.maxRetries   // Reader might think this is changeable
```

## Good

```groovy
class AppConfig {
    static final int MAX_RETRIES = 3
    static final String DEFAULT_HOST = 'localhost'
    static final int CONNECTION_TIMEOUT_MS = 5000
    static final List<String> SUPPORTED_LOCALES = ['en', 'fr', 'de'].asImmutable()
}

def max = AppConfig.MAX_RETRIES   // Clearly a constant

// Enum values are also constants
enum OrderStatus {
    PENDING,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED
}
```

## See Also

- [name-classes-PascalCase](name-classes-PascalCase.md) - Use PascalCase for classes
- [name-methods-camelCase](name-methods-camelCase.md) - Use camelCase for methods
- [name-abbrev-cautious](name-abbrev-cautious.md) - Spell out abbreviations
