# api-data-class-equality

> Use `data class` to get structural `equals`/`hashCode`/`copy` for free

## Why It Matters

Hand-rolled `equals`/`hashCode` implementations are easy to get wrong (forgetting a field, inconsistent hash codes) and cause subtle bugs in `HashMap`/`HashSet` lookups, test assertions, and deduplication. `data class` generates correct, structural implementations from the primary constructor properties, plus `copy()` and a readable `toString()`, eliminating an entire class of boilerplate bugs.

## Bad

```kotlin
class Point(val x: Int, val y: Int) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Point) return false
        return x == other.x  // Bug: forgot to compare y!
    }

    override fun hashCode(): Int = x  // Bug: hashCode doesn't include y either
}

class UserId(val value: String)

fun dedupe(ids: List<UserId>): Set<UserId> = ids.toSet()
// Every UserId is "distinct" because equals/hashCode use reference identity
```

## Good

```kotlin
data class Point(val x: Int, val y: Int)
// equals, hashCode, toString, copy(), componentN() all generated correctly

data class UserId(val value: String)

fun dedupe(ids: List<UserId>): Set<UserId> = ids.toSet()
// Works correctly: UserId("a") == UserId("a")

val p1 = Point(1, 2)
val p2 = p1.copy(y = 3)  // Point(x=1, y=3)
println(p1)              // Point(x=1, y=2) - readable toString for free
```

## When a Plain Class Is Better

```kotlin
// Entities with identity (e.g., JPA/database entities) should NOT be data classes:
// structural equals/hashCode on mutable, ID-based entities breaks Set/Map semantics
// when a field changes after insertion into a HashSet.
class UserEntity(var name: String, var age: Int) {
    val id: Long = generateId()

    override fun equals(other: Any?): Boolean = other is UserEntity && id == other.id
    override fun hashCode(): Int = id.hashCode()
}

// Classes with only behavior and no meaningful "value" also don't need data class.
class Logger(private val tag: String) {
    fun info(message: String) = println("[$tag] $message")
}
```

## Caveats

- Only primary-constructor properties participate in generated `equals`/`hashCode`/`copy`; properties declared in the class body are silently excluded.
- Avoid data classes with mutable (`var`) properties used as `HashMap` keys — mutating a field after insertion corrupts the bucket the entry lives in.
- Inheritance between data classes is restricted (a data class cannot extend another data class), which is intentional to keep structural equality well-defined.

## See Also

- [`api-copy-with-defaults`](api-copy-with-defaults.md) - use `copy()` for immutable partial updates
- [`type-data-class-value`](type-data-class-value.md) - choosing data class vs value class
- [`fn-destructuring-declarations`](fn-destructuring-declarations.md) - data classes enable componentN() destructuring
- [`anti-primitive-obsession`](anti-primitive-obsession.md) - wrap primitives in data classes for type safety
