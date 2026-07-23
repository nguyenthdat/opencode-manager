# type-data-class-value

> Use `data class` for types defined by their value

## Why It Matters

Hand-written `equals()`, `hashCode()`, and `toString()` are tedious, easy to get subtly wrong (forgetting a field, inconsistent hash/equals), and drown the actual domain logic in boilerplate. `data class` generates all three plus `copy()` and `componentN()` destructuring from the primary constructor, so two instances with the same property values are always equal by construction.

## Bad

```kotlin
class Point(val x: Int, val y: Int) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Point) return false
        return x == other.x  // Bug: forgot to compare y
    }

    override fun hashCode(): Int = x  // Inconsistent with equals above

    override fun toString(): String = "Point($x, $y)"
}
```

## Good

```kotlin
data class Point(val x: Int, val y: Int)
// equals(), hashCode(), toString(), copy(), component1()/component2()
// are all generated correctly and stay in sync with the constructor

val p1 = Point(1, 2)
val p2 = p1.copy(y = 3)          // Point(x=1, y=3)
val (x, y) = p1                  // destructuring via componentN()
println(p1)                      // "Point(x=1, y=2)"
println(p1 == Point(1, 2))       // true
```

## Only Constructor Properties Participate

Properties declared in the class body (not the primary constructor) are excluded from the generated `equals`/`hashCode`/`toString`/`copy` — a common source of confusion.

```kotlin
data class User(val id: String, val name: String) {
    var lastAccessed: Instant = Instant.now()  // NOT part of equals/hashCode/toString
}

val a = User("1", "Alice").apply { lastAccessed = Instant.parse("2020-01-01T00:00:00Z") }
val b = User("1", "Alice")
a == b  // true - lastAccessed is ignored
```

## See Also

- [`type-data-object-singleton`](type-data-object-singleton.md) - the singleton counterpart for stateless variants
- [`api-data-class-equality`](api-data-class-equality.md) - deeper rules on what participates in generated equality
- [`api-copy-with-defaults`](api-copy-with-defaults.md) - using `copy()` effectively for immutable updates
- [`fn-destructuring-declarations`](fn-destructuring-declarations.md) - using the generated `componentN()` functions
