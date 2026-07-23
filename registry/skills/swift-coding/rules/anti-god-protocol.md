# anti-god-protocol

> Don't design one giant protocol instead of composable smaller ones

## Why It Matters

A protocol with dozens of requirements forces every conformer to implement all of them, even the ones a given type has no meaningful behavior for — leading to empty stub implementations, `fatalError("not supported")` bodies, or awkward no-op defaults that exist only to satisfy the compiler. It also forces every consumer that only needs one or two of those capabilities to depend on the whole protocol, making mocks in tests bloated (implement 15 methods to test the one you care about) and making the protocol impossible to evolve without touching every conformer.

## Bad

```swift
protocol DataStore {
    func fetchUser(id: String) async throws -> User
    func saveUser(_ user: User) async throws
    func deleteUser(id: String) async throws
    func fetchOrders(userID: String) async throws -> [Order]
    func saveOrder(_ order: Order) async throws
    func syncWithServer() async throws
    func clearCache()
    func exportToCSV() -> Data
    func importFromCSV(_ data: Data) throws
    // every conformer must implement all nine, even a read-only in-memory test store
}

struct InMemoryUserStore: DataStore {
    func fetchUser(id: String) async throws -> User { /* ... */ }
    func saveUser(_ user: User) async throws { /* ... */ }
    func deleteUser(id: String) async throws { /* ... */ }
    func fetchOrders(userID: String) async throws -> [Order] { fatalError("not supported") }
    func saveOrder(_ order: Order) async throws { fatalError("not supported") }
    func syncWithServer() async throws { fatalError("not supported") }
    func clearCache() { }
    func exportToCSV() -> Data { fatalError("not supported") }
    func importFromCSV(_ data: Data) throws { fatalError("not supported") }
}
```

## Good

```swift
protocol UserRepository {
    func fetchUser(id: String) async throws -> User
    func saveUser(_ user: User) async throws
    func deleteUser(id: String) async throws
}

protocol OrderRepository {
    func fetchOrders(userID: String) async throws -> [Order]
    func saveOrder(_ order: Order) async throws
}

protocol SyncCoordinator {
    func syncWithServer() async throws
}

// Each conformer implements only what it actually supports:
struct InMemoryUserStore: UserRepository {
    func fetchUser(id: String) async throws -> User { /* ... */ }
    func saveUser(_ user: User) async throws { /* ... */ }
    func deleteUser(id: String) async throws { /* ... */ }
}

// Consumers depend only on the capability they need:
struct ProfileViewModel {
    let userRepository: any UserRepository   // doesn't need to know about orders or sync at all
}
```

## See Also

- [`api-protocol-associated-type`](api-protocol-associated-type.md) - designing focused protocol contracts with associated types
- [`api-composition-over-inheritance`](api-composition-over-inheritance.md) - composing multiple small protocols instead of one large one
- [`name-protocol-capability-suffix`](name-protocol-capability-suffix.md) - naming small, single-capability protocols clearly
- [`anti-massive-view-controller`](anti-massive-view-controller.md) - the concrete-type analog of an over-bundled abstraction
