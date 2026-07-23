# async-global-actor-custom

> Use custom global actors for cross-type isolation domains

## Why It Matters

`@MainActor` is a global actor for one specific domain (the main thread). When several unrelated types across your codebase need to share a *different* single serialization domain — for example, everything that touches a Core Data `NSManagedObjectContext`, or a specific hardware resource — a custom global actor gives you the same compiler-enforced, single-queue guarantee `@MainActor` gives the UI, without funneling unrelated work through the main thread.

## Bad

```swift
// Ad hoc locking spread across multiple unrelated types, easy to
// apply inconsistently and impossible for the compiler to check.
final class InventoryStore {
    private let lock = NSLock()
    private var items: [String: Int] = [:]

    func update(_ id: String, delta: Int) {
        lock.lock()
        items[id, default: 0] += delta
        lock.unlock()
    }
}

final class InventoryAuditor {
    // Also touches InventoryStore's storage some other way, with its
    // own separate lock — nothing ties these together or verifies
    // they can't race against each other.
}
```

## Good

```swift
@globalActor
actor InventoryActor {
    static let shared = InventoryActor()
}

@InventoryActor
final class InventoryStore {
    private var items: [String: Int] = [:]

    func update(_ id: String, delta: Int) {
        items[id, default: 0] += delta
    }
}

@InventoryActor
final class InventoryAuditor {
    func verify(_ store: InventoryStore) {
        // Compiler guarantees this runs on the same serialization domain
        // as InventoryStore — no manual locking, no possible race.
    }
}

// Calling in from outside requires await, same as any actor-isolated API
await InventoryStore().update("sku-1", delta: -1)
```

## Isolating a Single Function Instead of a Whole Type

```swift
@InventoryActor
func reconcileInventory() async {
    // Runs on InventoryActor even though it's a free function
}

// A single property or method can also opt in individually
final class MixedComponent {
    @InventoryActor var cachedCount: Int = 0
}
```

Reach for a custom global actor when a specific resource (not the UI, not a single object's own state) needs one shared serialization domain across multiple types — that's the scenario `actor` alone (which isolates one type's own state) doesn't cover.

## See Also

- [`async-mainactor-ui`](async-mainactor-ui.md) - MainActor is the built-in special case of this pattern
- [`async-actor-isolated-state`](async-actor-isolated-state.md) - plain actors for single-type isolation
- [`async-nonisolated-pure`](async-nonisolated-pure.md) - opting specific members out of a global actor's isolation
