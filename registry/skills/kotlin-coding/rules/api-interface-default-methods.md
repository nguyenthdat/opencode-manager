# api-interface-default-methods

> Use interface default method bodies for shared behavior without a base class

## Why It Matters

Kotlin classes can only extend one base class, so pushing shared behavior into an abstract base class forecloses other inheritance options and couples unrelated types together. Interfaces with default method bodies let you share implementation across otherwise-unrelated classes while each class keeps a single, meaningful superclass (or none) and can mix in as many interfaces as needed.

## Bad

```kotlin
// Forces every "loggable" thing into one inheritance branch
abstract class LoggableBase(protected val tag: String) {
    fun log(message: String) = println("[$tag] $message")
}

class OrderProcessor : LoggableBase("OrderProcessor") {
    // Now can't also extend some other useful base class
}

class PaymentGateway : LoggableBase("PaymentGateway") {
    // Same problem, and inherits fields it may not need
}
```

## Good

```kotlin
interface Loggable {
    val tag: String
    fun log(message: String) = println("[$tag] $message")  // default implementation
}

class OrderProcessor(override val tag: String = "OrderProcessor") : Loggable, Comparable<OrderProcessor> {
    override fun compareTo(other: OrderProcessor): Int = 0
}

class PaymentGateway(override val tag: String = "PaymentGateway") : Loggable
// Both classes get free logging behavior and remain free to extend a real base class too
```

## Resolving Diamond Conflicts

```kotlin
interface Named {
    fun describe(): String = "Named entity"
}

interface Timestamped {
    fun describe(): String = "Timestamped entity"
}

class Event : Named, Timestamped {
    // Compiler forces an explicit override when two supertypes provide the same default
    override fun describe(): String = super<Named>.describe() + " / " + super<Timestamped>.describe()
}
```

## When an Abstract Class Is Still Right

```kotlin
// Shared constructor logic, protected mutable state, or a strict "is-a" hierarchy
// with a single obvious parent still calls for an abstract base class.
abstract class Shape(protected val id: String) {
    abstract fun area(): Double
}
```

## See Also

- [`api-delegation-by-keyword`](api-delegation-by-keyword.md) - `by` delegation as another alternative to base-class inheritance
- [`type-sealed-class-hierarchy`](type-sealed-class-hierarchy.md) - when a closed hierarchy is the right shape instead
- [`api-visibility-internal`](api-visibility-internal.md) - keep default-method interfaces' surface intentionally narrow
