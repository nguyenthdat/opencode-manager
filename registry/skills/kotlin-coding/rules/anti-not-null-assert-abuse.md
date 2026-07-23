# anti-not-null-assert-abuse

> Don't scatter `!!` to silence the compiler

## Why It Matters

`!!` throws `KotlinNullPointerException` the instant the value is null, with a stack trace that just says "not null" and no context about which value or why. Reaching for it every time the compiler complains about nullability doesn't fix the underlying nullable design — it just delays the crash from compile time to runtime, exactly where Kotlin's null-safety was supposed to protect you.

## Bad

```kotlin
fun greet(user: User?) {
    // Crashes with zero context if user is null
    println("Hello, ${user!!.name}")
}

fun findFirstAdmin(users: List<User>): User {
    return users.firstOrNull { it.isAdmin }!!  // which call site? no idea when it crashes
}

class ViewModel {
    private var _data: Data? = null
    fun render() {
        // Assumes load() already ran - true until a refactor moves this call earlier
        renderView(_data!!)
    }
}
```

## Good

```kotlin
fun greet(user: User?) {
    val name = user?.name ?: "Guest"
    println("Hello, $name")
}

fun findFirstAdmin(users: List<User>): User? =
    users.firstOrNull { it.isAdmin }  // let the caller decide how to handle absence

class ViewModel {
    private var data: Data? = null
    fun render() {
        val current = data ?: return  // explicit, no crash, no context loss
        renderView(current)
    }
}
```

## When It's Still Sometimes Seen

```kotlin
// Immediately after a null-check the compiler can't smart-cast through
// (e.g. across a lambda boundary) - even here, prefer a local val
if (cache["key"] != null) {
    cache["key"]!!.use() // works, but a local val is still clearer:
    // val value = cache["key"] ?: return
}

// Test code, where an unexpected null should fail the test loudly
// and a full stack trace is exactly what you want
@Test
fun `loads config`() {
    val config = repository.find("id")!! // acceptable: test failure IS the point
}
```

Outside tests and truly-just-checked smart-cast gaps, treat every `!!` in a PR as a design smell worth questioning.

## Detekt Rule

```yaml
# config/detekt.yml
style:
  UnsafeCallOnNullableType:
    active: true
```

## See Also

- [`type-avoid-not-null-assert`](type-avoid-not-null-assert.md) - the positive-framed rule this anti-pattern violates
- [`type-safe-call-operator`](type-safe-call-operator.md) - the safe-call alternative to reach for instead
- [`type-elvis-default`](type-elvis-default.md) - provide a default instead of asserting non-null
- [`anti-lateinit-overuse`](anti-lateinit-overuse.md) - a related shortcut around Kotlin's null-safety guarantees
