# api-inline-reified-generic

> Use `inline`/`reified` when a generic function needs runtime type information

## Why It Matters

JVM generics are erased at runtime, so a normal generic function cannot check `value is T` or call `T::class` - the type parameter simply doesn't exist at runtime. Marking a function `inline` with a `reified` type parameter causes the compiler to substitute the actual type at every call site, giving you real runtime type checks and reflection without an explicit `Class<T>` parameter.

## Bad

```kotlin
fun <T> Gson.fromJson(json: String, clazz: Class<T>): T = fromJson(json, clazz)

val user = gson.fromJson(json, User::class.java)  // caller must pass Class<T> manually

fun <T> firstInstanceOf(list: List<Any>): T? {
    for (item in list) {
        if (item is T) return item  // compile error: cannot check for instance of erased type T
    }
    return null
}
```

## Good

```kotlin
inline fun <reified T> Gson.fromJson(json: String): T = fromJson(json, T::class.java)

val user: User = gson.fromJson(json)  // type inferred from the assignment target

inline fun <reified T> firstInstanceOf(list: List<Any>): T? {
    for (item in list) {
        if (item is T) return item  // works: T is reified, real type check at each call site
    }
    return null
}
```

## Reified Type Checks and Class References

```kotlin
inline fun <reified T> List<*>.filterIsInstanceTyped(): List<T> =
    filter { it is T }.map { it as T }

inline fun <reified T : Any> logTypeName() = println(T::class.simpleName)

logTypeName<OrderProcessor>()  // prints "OrderProcessor" with no Class<T> argument
```

## Costs and Constraints

```kotlin
// inline functions copy their bytecode into every call site - large inline functions
// used in many places increase binary size. Keep inline reified functions small.
// reified type parameters also can't be used on member functions of a class -
// only on top-level or extension functions.

inline fun <reified T> Any.safeCast(): T? = this as? T
```

## See Also

- [`type-star-projection`](type-star-projection.md) - handling erased generics when reification isn't available
- [`perf-inline-lambda-functions`](perf-inline-lambda-functions.md) - the general inline-function performance tradeoff
- [`interop-suspend-fun-from-java`](interop-suspend-fun-from-java.md) - inline reified functions have their own Java interop limitations
