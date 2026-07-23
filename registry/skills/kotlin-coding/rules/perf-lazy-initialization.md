# perf-lazy-initialization

> Defer expensive initialization with `lazy { }`

## Why It Matters

Eagerly initializing an expensive field — parsing a config file, opening a connection, building a large lookup table — in a constructor pays that cost even when the value is never used. `lazy { }` defers computation until first access and caches the result, using thread-safe synchronization by default.

## Bad

```kotlin
class ReportGenerator {
    val template: Template = loadAndParseTemplate("report.tpl") // parsed even if generate() is never called
    val locale: Locale = detectSystemLocale() // expensive syscalls on every instance
}
```

## Good

```kotlin
class ReportGenerator {
    val template: Template by lazy { loadAndParseTemplate("report.tpl") } // parsed on first access only
    val locale: Locale by lazy { detectSystemLocale() }
}
```

## Choosing a Thread-Safety Mode

```kotlin
class Metrics {
    // SYNCHRONIZED (default): safe under concurrent first access, small lock overhead
    val expensive by lazy { computeExpensive() }

    // PUBLICATION: multiple threads may compute concurrently; the first result wins and is cached
    val cache by lazy(LazyThreadSafetyMode.PUBLICATION) { buildCache() }

    // NONE: no locking at all, only safe if access is guaranteed single-threaded
    val fastPath by lazy(LazyThreadSafetyMode.NONE) { computeFastPath() }
}
```

## See Also

- [`perf-profile-before-optimize`](perf-profile-before-optimize.md) - confirm initialization cost is worth deferring
- [`perf-coroutine-dispatcher-overhead`](perf-coroutine-dispatcher-overhead.md) - another deferred-cost/eager-cost trade-off
- [`type-lateinit-discipline`](type-lateinit-discipline.md) - the mutable, non-caching alternative to `lazy`
