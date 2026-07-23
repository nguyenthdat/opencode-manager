# type-avoid-not-null-assert

> Avoid `!!`; prove non-null through control flow or types instead

## Why It Matters

`!!` throws a bare `KotlinNullPointerException` with no context about which value was null or why, turning a compile-time safety net into a runtime crash indistinguishable from Java's classic NPE. Nearly every `!!` can be replaced by a safe call, an Elvis default, a `require`/`check`, or a type that simply doesn't allow null in the first place.

## Bad

```kotlin
fun processOrder(order: Order?) {
    val id = order!!.id  // Crashes with no context if order is null
    println("Processing $id")
}

class UserSession {
    var token: String? = null

    fun authenticatedRequest(): Response {
        return api.call(token!!)  // Crashes deep in a call chain
    }
}

fun firstEven(numbers: List<Int>): Int {
    return numbers.find { it % 2 == 0 }!!  // Crashes if none found
}
```

## Good

```kotlin
fun processOrder(order: Order?) {
    val id = order?.id ?: return
    println("Processing $id")
}

class UserSession {
    var token: String? = null

    fun authenticatedRequest(): Response {
        val currentToken = checkNotNull(token) { "authenticatedRequest() called before login" }
        return api.call(currentToken)
    }
}

fun firstEven(numbers: List<Int>): Int? {
    return numbers.find { it % 2 == 0 }
}
```

## When `!!` Is Acceptable

```kotlin
// 1. Immediately after an explicit non-null check the compiler can't smart-cast
//    (e.g. across a lambda boundary) - prefer restructuring first, but this is a fallback
val cached = cache[key]
if (cached != null) {
    backgroundScope.launch {
        use(cached!!)  // Smart cast doesn't survive into the lambda
    }
}

// 2. Test code asserting a fixture is set up correctly
@Test
fun `parses valid input`() {
    val result = parser.parse("42")
    assertEquals(42, result!!)
}
```

## Detekt/ktlint Rule

Detekt's `UnsafeCallOnNullableType` flags every `!!` usage. Enable it at `warning` or `error` severity project-wide and use targeted `@Suppress("UnsafeCallOnNullableType")` with a comment for the rare justified case:

```yaml
potential-bugs:
  UnsafeCallOnNullableType:
    active: true
```

## See Also

- [`type-safe-call-operator`](type-safe-call-operator.md) - primary replacement for `!!` chains
- [`type-elvis-default`](type-elvis-default.md) - supply a fallback instead of asserting
- [`err-check-invariant`](err-check-invariant.md) - `checkNotNull` gives a descriptive message instead of a bare crash
- [`anti-not-null-assert-abuse`](anti-not-null-assert-abuse.md) - broader anti-pattern this rule prevents
