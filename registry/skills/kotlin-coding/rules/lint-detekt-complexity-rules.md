# lint-detekt-complexity-rules

> Enable detekt complexity rules to catch long/complex functions

## Why It Matters

A 300-line function with cyclomatic complexity of 40 is nearly impossible to unit test exhaustively or reason about during review, but nothing stops it from growing one `if` at a time until it's unmaintainable. Detekt's complexity rule set (`LongMethod`, `ComplexMethod`, `TooManyFunctions`, `LargeClass`) flags these thresholds automatically, before the function becomes a rewrite project.

## Bad

```kotlin
// config/detekt.yml
complexity:
    active: false  // or simply never configured, using defaults nobody reviewed
```

```kotlin
// 220 lines, 15 branches, does validation, pricing, tax, shipping, and
// notification in one function - detekt would flag this, but it's off
fun processOrder(order: Order): OrderResult {
    if (order.items.isEmpty()) { /* ... */ }
    if (order.items.any { it.quantity <= 0 }) { /* ... */ }
    // ... 200 more lines ...
    error("unimplemented")
}
```

## Good

```yaml
# config/detekt.yml
complexity:
  active: true
  LongMethod:
    active: true
    threshold: 40
  ComplexMethod:
    active: true
    threshold: 10
  LargeClass:
    active: true
    threshold: 300
  TooManyFunctions:
    active: true
    thresholdInClasses: 20
```

```kotlin
// Flagged by LongMethod/ComplexMethod, forcing a split:
fun processOrder(order: Order): OrderResult {
    validate(order)
    val priced = applyPricing(order)
    val taxed = applyTax(priced)
    val shipped = applyShipping(taxed)
    notifyCustomer(shipped)
    return shipped
}

private fun validate(order: Order) { /* ... */ }
private fun applyPricing(order: Order): PricedOrder = /* ... */ error("unimplemented")
```

## Tuning Thresholds

Default thresholds are a starting point, not gospel — a domain with genuinely complex business rules (tax calculation) may warrant a slightly higher `ComplexMethod` threshold there via a per-package detekt config, rather than disabling the rule project-wide.

## See Also

- [`lint-detekt-baseline`](lint-detekt-baseline.md) - freeze existing violations before turning this on for legacy code
- [`anti-god-object`](anti-god-object.md) - `LargeClass`/`TooManyFunctions` are the detekt-level detector for this anti-pattern
- [`anti-deep-nesting-when`](anti-deep-nesting-when.md) - a common source of the complexity these rules catch
