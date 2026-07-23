# api-property-delegate-custom

> Use property delegates (`lazy`, `observable`, custom) to encapsulate accessor logic

## Why It Matters

Repeating the same getter/setter boilerplate (lazy initialization checks, change notification, validation) across many properties clutters classes and invites copy-paste bugs. Property delegates factor that boilerplate into a single reusable `getValue`/`setValue` implementation, so each property declaration stays a one-liner while the cross-cutting behavior (laziness, observability, validation) lives in one tested place.

## Bad

```kotlin
class UserProfile {
    private var _avatarUrl: String? = null
    val avatarUrl: String
        get() {
            if (_avatarUrl == null) {
                _avatarUrl = expensiveFetchAvatar()  // manual lazy init, repeated per property
            }
            return _avatarUrl!!
        }

    private var _theme: String = "light"
    var theme: String
        get() = _theme
        set(value) {
            println("theme changed from $_theme to $value")  // manual change notification
            _theme = value
        }
}
```

## Good

```kotlin
class UserProfile {
    val avatarUrl: String by lazy { expensiveFetchAvatar() }

    var theme: String by Delegates.observable("light") { _, old, new ->
        println("theme changed from $old to $new")
    }
}
```

## Custom Delegate: Validated Property

```kotlin
class PositiveInt(private var value: Int) {
    operator fun getValue(thisRef: Any?, property: KProperty<*>): Int = value

    operator fun setValue(thisRef: Any?, property: KProperty<*>, newValue: Int) {
        require(newValue > 0) { "${property.name} must be positive, got $newValue" }
        value = newValue
    }
}

class Inventory {
    var stock: Int by PositiveInt(10)
}

val inventory = Inventory()
inventory.stock = 5     // OK
inventory.stock = -1    // throws IllegalArgumentException: stock must be positive, got -1
```

## Map-Backed Delegates

```kotlin
class Config(map: Map<String, Any?>) {
    val host: String by map
    val port: Int by map
}

val config = Config(mapOf("host" to "localhost", "port" to 8080))
println(config.host)  // "localhost" - reads directly from the map by property name
```

## See Also

- [`perf-lazy-initialization`](perf-lazy-initialization.md) - `lazy` delegate semantics and thread-safety modes
- [`api-delegation-by-keyword`](api-delegation-by-keyword.md) - class-level `by` delegation, the related but distinct mechanism
- [`err-require-precondition`](err-require-precondition.md) - `require` inside custom setters for validation
