# fn-val-over-var

> Default to `val`; use `var` only when reassignment is genuinely required

## Why It Matters

A `val` is a compile-time guarantee that a reference never changes after initialization, which eliminates an entire category of bugs where a variable is mutated somewhere unexpected in a long function or shared across threads. Defaulting to `val` also documents intent: when you do see a `var`, it signals "this genuinely changes," making it easier to reason about where and why mutation happens.

## Bad

```kotlin
fun calculateTotal(items: List<Item>): Double {
    var total = 0.0
    var discount = 0.0
    var tax = 0.0
    for (item in items) {
        total += item.price
    }
    discount = if (total > 100) total * 0.1 else 0.0
    tax = (total - discount) * 0.08
    return total - discount + tax
    // discount and tax are each assigned exactly once - var is unnecessary and hides that
}
```

## Good

```kotlin
fun calculateTotal(items: List<Item>): Double {
    val total = items.sumOf { it.price }
    val discount = if (total > 100) total * 0.1 else 0.0
    val tax = (total - discount) * 0.08
    return total - discount + tax
}
```

## When `var` Is Genuinely Needed

```kotlin
fun findFirstEven(numbers: List<Int>): Int? {
    var result: Int? = null   // must be var: assigned conditionally, possibly multiple branches
    for (n in numbers) {
        if (n % 2 == 0) {
            result = n
            break
        }
    }
    return result
}

// Better still: replace the loop with a val + built-in function where possible
fun findFirstEvenIdiomatic(numbers: List<Int>): Int? = numbers.firstOrNull { it % 2 == 0 }

// Accumulator loops genuinely need var when there's no direct stdlib equivalent
fun runningTotals(numbers: List<Int>): List<Int> {
    var sum = 0
    return numbers.map { sum += it; sum }
}
```

## Detekt/ktlint Rule

`detekt`'s `VariableMinLength`/`UnusedPrivateProperty` plus IntelliJ's "Convert to val" inspection catch obviously-unnecessary `var`s automatically; enable `detekt`'s style rule set and treat any flagged `var` that's assigned exactly once as a signal to switch to `val`.

## See Also

- [`fn-immutable-collection-types`](fn-immutable-collection-types.md) - the collection-level analog of preferring immutability
- [`anti-var-for-immutable-state`](anti-var-for-immutable-state.md) - the anti-pattern this rule directly targets
- [`anti-mutable-shared-state`](anti-mutable-shared-state.md) - why unchecked `var` is especially dangerous under concurrency
