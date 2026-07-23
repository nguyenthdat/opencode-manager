# perf-inline-lambda-functions

> Mark small higher-order functions `inline` to avoid lambda allocation

## Why It Matters

Kotlin lambdas compile to `Function` objects unless the receiving function is `inline`, so every call site that accepts a lambda parameter allocates and dispatches through that object. In hot loops or frequently-called utility functions, this adds allocation and virtual-call overhead that a simple `inline` modifier eliminates by copying the lambda body directly into the call site.

## Bad

```kotlin
fun <T, R> measure(block: () -> R): R {
    val start = System.nanoTime()
    val result = block()
    println("took ${System.nanoTime() - start}ns")
    return result
}

fun repeatWork(times: Int, action: (Int) -> Unit) {
    for (i in 0 until times) action(i) // Function1 object allocated at every call site, no non-local return
}
```

## Good

```kotlin
inline fun <T, R> measure(block: () -> R): R {
    val start = System.nanoTime()
    val result = block()
    println("took ${System.nanoTime() - start}ns")
    return result
}

inline fun repeatWork(times: Int, action: (Int) -> Unit) {
    for (i in 0 until times) action(i) // body inlined, no Function object, supports non-local `return`
}
```

## When Not To Inline

- Large function bodies: inlining copies the body into every call site, bloating bytecode size.
- Functions with a lambda that must be stored or passed elsewhere: mark it `noinline`.
- Public API surfaces where you want to change the implementation without forcing callers to recompile.

```kotlin
inline fun runBoth(first: () -> Unit, noinline second: () -> Unit) {
    first()
    storeForLater(second) // noinline lambda can be captured as an object since it isn't inlined
}
```

## Detekt/ktlint Rule

Detekt's `UnnecessaryInlineModifier` in the `performance`/`style` rule sets flags `inline` on functions with no functional parameters, but there is no automatic rule that flags *missing* `inline` on hot-path lambdas — treat this as a profiling-driven decision, not a blanket lint.

## See Also

- [`perf-collection-chain-cost`](perf-collection-chain-cost.md) - another source of hidden allocation in pipelines
- [`perf-avoid-reflection-hot-path`](perf-avoid-reflection-hot-path.md) - similar hot-path allocation/dispatch concern
- [`fn-higher-order-functions`](fn-higher-order-functions.md) - general guidance on functions taking lambdas
- [`api-inline-reified-generic`](api-inline-reified-generic.md) - inline functions also enable reified type parameters
