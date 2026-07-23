# interop-collection-interop-java

> Understand mutable/read-only collection interop gaps at Java boundaries

## Why It Matters

Kotlin's `List`/`Map` read-only interfaces are a compile-time-only distinction — at the JVM level they're the same `java.util.List`/`Map`. Java code receiving a Kotlin "read-only" `List` can call `.add()` and mutate it directly, silently violating the Kotlin-side contract, and Kotlin calling into a Java API can receive a raw mutable collection typed as read-only with no compiler warning.

## Bad

```kotlin
class OrderService {
    private val _orders = mutableListOf<Order>()
    val orders: List<Order> get() = _orders // "read-only" in Kotlin, but the same object as _orders
}
```

```java
// Java sees a plain java.util.List and can mutate it - the Kotlin "immutability" is not enforced
OrderService service = new OrderService();
List<Order> orders = service.getOrders();
orders.clear(); // compiles fine, breaks OrderService's invariant silently
```

## Good

```kotlin
class OrderService {
    private val _orders = mutableListOf<Order>()
    val orders: List<Order> get() = _orders.toList() // defensive copy exposed at the boundary
    // or: Collections.unmodifiableList(_orders) for a live, mutation-throwing view
}
```

## Receiving Java Collections

```kotlin
fun importLegacyItems(items: java.util.List<String>) {
    val safeCopy: List<String> = items.toList() // copy immediately; don't trust the Java caller's mutability discipline
}
```

## See Also

- [`interop-platform-type-handling`](interop-platform-type-handling.md) - the related nullability side of Java interop
- [`anti-mutable-public-collections`](anti-mutable-public-collections.md) - the general anti-pattern this guards against
- [`fn-immutable-collection-types`](fn-immutable-collection-types.md) - Kotlin-side immutable collection conventions
