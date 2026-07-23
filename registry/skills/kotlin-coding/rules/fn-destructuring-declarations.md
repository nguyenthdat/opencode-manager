# fn-destructuring-declarations

> Use destructuring declarations for data classes, `Map.Entry`, and `Pair`

## Why It Matters

Accessing `.first`/`.second` or a data class's individual properties by name at every use site is verbose and, for `Pair`/`Triple`, not self-documenting about what each position means. Destructuring declarations unpack a `componentN()`-providing type into named local variables in a single line, which is both shorter and clearer about what each value represents at the call site.

## Bad

```kotlin
data class Coordinates(val lat: Double, val lng: Double)

fun describe(coord: Coordinates): String = "${coord.lat}, ${coord.lng}"

for (entry in mapOf("a" to 1, "b" to 2)) {
    println("${entry.key} = ${entry.value}")  // verbose access via .key/.value
}

val pair = "Alice" to 30
println("${pair.first} is ${pair.second}")  // first/second don't say what they mean
```

## Good

```kotlin
data class Coordinates(val lat: Double, val lng: Double)

fun describe(coord: Coordinates): String {
    val (lat, lng) = coord
    return "$lat, $lng"
}

for ((key, value) in mapOf("a" to 1, "b" to 2)) {
    println("$key = $value")
}

val (name, age) = "Alice" to 30
println("$name is $age")
```

## Destructuring in Lambda Parameters

```kotlin
val users = listOf(Coordinates(1.0, 2.0), Coordinates(3.0, 4.0))
users.forEach { (lat, lng) -> println("lat=$lat lng=$lng") }

mapOf("x" to 1, "y" to 2).mapValues { (key, value) -> "$key=$value" }
```

## Caveat: Destructuring Is Positional, Not Named

```kotlin
data class Rectangle(val width: Int, val height: Int)

fun area(rect: Rectangle): Int {
    val (w, h) = rect  // relies on declaration order (width, height) - reordering breaks silently
    return w * h
}
// If Rectangle's constructor parameters are ever reordered, every destructuring call site
// silently swaps meaning. For >2-3 fields or fields likely to be reordered, prefer named access.
```

## See Also

- [`api-data-class-equality`](api-data-class-equality.md) - data classes get `componentN()` generated automatically
- [`fn-scope-function-let`](fn-scope-function-let.md) - often combined with destructuring in lambda parameters
- [`name-classes-pascal`](name-classes-pascal.md) - descriptive names for destructured variables matter more given the positional risk
