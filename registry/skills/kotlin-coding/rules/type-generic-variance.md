# type-generic-variance

> Declare `out`/`in` variance so generic APIs are usable and safe

## Why It Matters

Without variance annotations, `Container<Cat>` and `Container<Animal>` are unrelated types even though every `Cat` is an `Animal`, which forces callers to write awkward wildcard-free code or unsafe casts. Declaring `out T` (covariant, "produces T") or `in T` (contravariant, "consumes T") tells the compiler exactly how a generic type is used internally, so it can both allow the intuitive subtyping and reject genuinely unsafe assignments at compile time.

## Bad

```kotlin
class Box<T>(private val item: T) {
    fun get(): T = item
}

fun printAnimal(box: Box<Animal>) {
    println(box.get().sound())
}

val catBox: Box<Cat> = Box(Cat())
printAnimal(catBox)  // Compile error: Box<Cat> is not a Box<Animal> without variance
```

## Good

```kotlin
// `out T`: this box only ever produces T, never consumes it - safe to be covariant
class Box<out T>(private val item: T) {
    fun get(): T = item
}

fun printAnimal(box: Box<Animal>) {
    println(box.get().sound())
}

val catBox: Box<Cat> = Box(Cat())
printAnimal(catBox)  // Now compiles: Box<out T> makes Box<Cat> a subtype of Box<Animal>

// `in T`: this comparator only ever consumes T - safe to be contravariant
class AnimalComparator : Comparator<Animal> {
    override fun compare(a: Animal, b: Animal): Int = a.name.compareTo(b.name)
}

fun sortCats(cats: MutableList<Cat>, comparator: Comparator<in Cat>) {
    cats.sortWith(comparator)
}

sortCats(mutableListOf(Cat(), Cat()), AnimalComparator())  // Comparator<Animal> accepted for Comparator<in Cat>
```

## Why The Compiler Enforces Direction

A covariant `out T` parameter may only appear in "producer" (return) positions; a contravariant `in T` may only appear in "consumer" (parameter) positions. This is what makes the variance sound — if `Box<out T>` allowed a `set(item: T)` method, a `Box<Animal>` reference to a real `Box<Cat>` could accept a `Dog`, corrupting the underlying `Cat` box.

```kotlin
class Box<out T>(private val item: T) {
    fun get(): T = item
    // fun set(value: T) { }  // Compile error: T is `out` and cannot appear in an `in` position
}
```

Kotlin's built-in `List<out E>` is covariant (read-only) while `MutableList<E>` is invariant because it both reads and writes `E`; `Comparator<in T>` and `kotlinx.coroutines`' `SendChannel<in E>` are contravariant because they only consume.

## See Also

- [`type-star-projection`](type-star-projection.md) - use `<*>` when the variance direction can't be pinned down
- [`api-inline-reified-generic`](api-inline-reified-generic.md) - related generics feature for inline functions
- [`type-sealed-class-hierarchy`](type-sealed-class-hierarchy.md) - sealed hierarchies often combine with variance in result types
