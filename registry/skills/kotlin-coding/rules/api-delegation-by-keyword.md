# api-delegation-by-keyword

> Use the `by` keyword for interface delegation instead of inheritance

## Why It Matters

Extending a class just to reuse its implementation (rather than because of a real "is-a" relationship) creates tight coupling: the subclass inherits every public member, breaks if the superclass changes, and can't delegate to a different implementation at runtime. Interface delegation with `by` composes behavior instead of inheriting it, so you get code reuse without the fragile-base-class problem, and can swap the delegate at construction time.

## Bad

```kotlin
// Inheriting from ArrayList just to add one method - now exposes the entire
// mutable List API (add, removeAt, clear...) whether that's wanted or not
class UniqueList<T> : ArrayList<T>() {
    fun addUnique(item: T) {
        if (!contains(item)) add(item)
    }
}

val list = UniqueList<String>()
list.add("dup")
list.add("dup")  // bypasses addUnique entirely - inheritance can't prevent this
```

## Good

```kotlin
class UniqueList<T>(private val backing: MutableList<T> = mutableListOf()) : List<T> by backing {
    fun addUnique(item: T) {
        if (item !in backing) backing.add(item)
    }
}

val list = UniqueList<String>()
list.addUnique("dup")
list.addUnique("dup")  // only path to mutate, so uniqueness is actually enforced
// The public surface is List<T> (read-only) plus addUnique - nothing else leaks
```

## Swappable Delegates at Construction

```kotlin
interface Logger {
    fun log(message: String)
}

class ConsoleLogger : Logger {
    override fun log(message: String) = println(message)
}

class Service(logger: Logger = ConsoleLogger()) : Logger by logger {
    fun run() {
        log("Service starting")  // delegated call, but the implementation is pluggable
    }
}

// Tests can inject a fake without subclassing Service at all
class FakeLogger : Logger {
    val messages = mutableListOf<String>()
    override fun log(message: String) { messages.add(message) }
}
Service(logger = FakeLogger())
```

## See Also

- [`api-interface-default-methods`](api-interface-default-methods.md) - another alternative to base-class inheritance
- [`api-property-delegate-custom`](api-property-delegate-custom.md) - `by` for property delegation, a related but distinct mechanism
- [`test-fake-over-mock`](test-fake-over-mock.md) - delegation makes swapping in fakes for tests trivial
