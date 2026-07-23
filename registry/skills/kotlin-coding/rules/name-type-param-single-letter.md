# name-type-param-single-letter

> Use single uppercase letters for generic type parameters: `T`, `K`, `V`, `E`

## Why It Matters

Single-letter type parameters (`T` for Type, `K`/`V` for Key/Value, `E` for Element, `R` for Result) are an established convention shared with Java and the Kotlin standard library; deviating from it (spelling out `TypeParam` or using lowercase) makes generic signatures harder to scan and clashes with IDE tooling that recognizes the convention for renaming/highlighting.

## Bad

```kotlin
class Box<ContainedType>(val value: ContainedType)

interface Repository<key, value> {
    fun get(id: key): value?
}

fun <input, output> transform(items: List<input>, f: (input) -> output): List<output> =
    items.map(f)
```

## Good

```kotlin
class Box<T>(val value: T)

interface Repository<K, V> {
    fun get(id: K): V?
}

fun <I, O> transform(items: List<I>, f: (I) -> O): List<O> =
    items.map(f)
```

## Conventional Letters

```kotlin
class Cache<K, V>                 // Key, Value
class LinkedList<E>                // Element
fun <T> identity(value: T): T = value   // generic Type
fun <R> Iterable<*>.mapTo(): List<R> = TODO() // Result of a transform
interface Comparator<in T>         // contravariant Type
```

When more than four or five type parameters are needed, that's usually a sign the type itself is doing too much — consider whether a data class or separate type would clarify things more than adding `T1`, `T2`, `T3`.

## See Also

- [`type-generic-variance`](type-generic-variance.md) - `in`/`out` modifiers on these same type parameters
- [`type-star-projection`](type-star-projection.md) - using `*` when the exact type parameter is unknown
- [`api-inline-reified-generic`](api-inline-reified-generic.md) - reified type parameters on inline functions
