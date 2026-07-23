# perf-string-builder-concat

> Use `StringBuilder`/`buildString` for repeated string concatenation

## Why It Matters

Strings are immutable on the JVM, so `a + b` inside a loop allocates a brand-new `String` on every iteration, turning what should be an O(n) concatenation into O(n^2) copying as the string grows. `StringBuilder`/`buildString` mutate a single growable buffer instead, making the operation genuinely linear.

## Bad

```kotlin
fun buildCsvRow(fields: List<String>): String {
    var row = ""
    for (field in fields) {
        row += field + "," // a new String is allocated every iteration
    }
    return row
}
```

## Good

```kotlin
fun buildCsvRow(fields: List<String>): String = buildString {
    for (field in fields) {
        append(field)
        append(',')
    }
}

// Or when a simple delimiter is enough:
fun buildCsvRowJoined(fields: List<String>): String = fields.joinToString(",")
```

## Detekt/ktlint Rule

There is no built-in ktlint rule that flags string concatenation in a loop, and detekt's `performance` rule set doesn't directly catch this pattern either — rely on code review and JMH/`kotlinx-benchmark` measurements on any loop suspected of being hot before rewriting it.

## See Also

- [`perf-collection-chain-cost`](perf-collection-chain-cost.md) - similar intermediate-allocation concern in pipelines
- [`perf-profile-before-optimize`](perf-profile-before-optimize.md) - confirm the loop is actually hot before optimizing
- [`perf-avoid-boxing-primitives`](perf-avoid-boxing-primitives.md) - another common source of avoidable allocation
