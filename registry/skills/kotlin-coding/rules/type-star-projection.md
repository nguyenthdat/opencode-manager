# type-star-projection

> Use star-projection `<*>` only when the type argument is truly unknown

## Why It Matters

`List<*>` says "a list of something, I genuinely don't know or care what" and restricts you to reading elements as `Any?` and writing nothing at all — it is not a shortcut for "generic type, don't bother declaring." Reaching for `<*>` when you actually know or need the type parameter throws away compile-time type safety that a proper type parameter or variance annotation would have preserved.

## Bad

```kotlin
fun printAll(list: List<*>) {
    for (item in list) {
        println(item)  // Only Any? available - can't call type-specific methods
    }
}

// Using <*> to sidestep writing a real generic signature
fun addToFirst(list: MutableList<*>, item: Any) {
    // list.add(item) would not compile - MutableList<*> forbids writes entirely
}

class Repository<T> {
    fun save(item: Any) { /* should be T, but author used Any to avoid the generic */ }
}
```

## Good

```kotlin
// Genuinely unknown/heterogeneous element type - star projection is correct here
fun printAll(list: List<*>) {
    for (item in list) {
        println(item)
    }
}

// Known element type - use a real (possibly generic) signature instead
fun <T> addToFirst(list: MutableList<T>, item: T) {
    list.add(0, item)
}

class Repository<T> {
    fun save(item: T) { /* type-safe, no cast needed */ }
}
```

## When `<*>` Is The Right Choice

```kotlin
// Reflection-style code that genuinely doesn't know the parameter at compile time
fun describeType(kClass: KClass<*>): String = kClass.simpleName ?: "Unknown"

// A registry holding heterogeneous typed values behind a common interface
val handlers: Map<String, EventHandler<*>> = mapOf(
    "click" to ClickHandler(),
    "scroll" to ScrollHandler(),
)

// Checking membership without needing the element type
fun isEmptyCollection(value: Any?): Boolean = value is Collection<*> && value.isEmpty()
```

## See Also

- [`type-generic-variance`](type-generic-variance.md) - `out`/`in` often make star-projection unnecessary
- [`api-inline-reified-generic`](api-inline-reified-generic.md) - reified generics as an alternative to type erasure workarounds
- [`anti-primitive-obsession`](anti-primitive-obsession.md) - related discipline of using precise types over vague ones
