# api-protocol-associated-type

> Use associated types for protocol-level generic contracts

## Why It Matters

An associated type lets a protocol describe a generic contract ("some type of element", "some type of failure") without pinning down the concrete type, so each conformer can specialize it appropriately while the protocol stays reusable. Without it, protocols end up either duplicated per concrete type or forced to use `Any`, losing compile-time type safety and forcing runtime casts at every call site.

## Bad

```swift
protocol Repository {
    func fetch(id: String) -> Any            // callers must cast the result
    func save(_ item: Any) -> Bool           // no compile-time guarantee of the right type
}

struct UserRepository: Repository {
    func fetch(id: String) -> Any { User(id: id, name: "placeholder") }
    func save(_ item: Any) -> Bool {
        guard let user = item as? User else { return false }   // unsafe cast at runtime
        return true
    }
}
```

## Good

```swift
protocol Repository {
    associatedtype Item
    func fetch(id: String) -> Item?
    func save(_ item: Item) -> Bool
}

struct UserRepository: Repository {
    func fetch(id: String) -> User? { User(id: id, name: "placeholder") }
    func save(_ item: User) -> Bool { true }   // fully type-checked, no casts
}

func printFetched<R: Repository>(_ repository: R, id: String) where R.Item: CustomStringConvertible {
    if let item = repository.fetch(id: id) {
        print(item.description)
    }
}
```

## Working Around Associated Types When Type Erasure Is Needed

Protocols with associated types can't be used as `any Repository` existentials directly. When you need to store heterogeneous conformers, either constrain with a generic function (as above) or write a type-eraser:

```swift
struct AnyRepository<Item> {
    private let _fetch: (String) -> Item?
    private let _save: (Item) -> Bool

    init<R: Repository>(_ repository: R) where R.Item == Item {
        _fetch = repository.fetch
        _save = repository.save
    }

    func fetch(id: String) -> Item? { _fetch(id) }
    func save(_ item: Item) -> Bool { _save(item) }
}

let repositories: [AnyRepository<User>] = [AnyRepository(UserRepository())]
```

## See Also

- [`api-existential-any`](api-existential-any.md) - the existential alternative when associated types aren't needed
- [`api-protocol-oriented`](api-protocol-oriented.md) - the broader protocol-first design this specializes
- [`name-generic-placeholder`](name-generic-placeholder.md) - naming conventions for generic/associated type parameters
