# async-nonisolated-pure

> Mark side-effect-free actor members `nonisolated`

## Why It Matters

Every member of an actor (or a `@MainActor` type) is isolated by default, meaning callers outside the actor must `await` to access it — even members that don't touch any mutable actor state, like a computed property derived from `let` constants or a pure formatting function. Marking those `nonisolated` lets callers use them synchronously, without an unnecessary `await`, while the compiler still verifies they don't touch isolated state.

## Bad

```swift
actor OrderProcessor {
    let orderID: UUID
    private var status: OrderStatus = .pending

    init(orderID: UUID) {
        self.orderID = orderID
    }

    // This never touches `status`, but callers still have to await it
    // because everything on an actor is isolated by default.
    func formattedID() -> String {
        "ORDER-\(orderID.uuidString.prefix(8))"
    }
}

// Forces an unnecessary await for a pure, synchronous-feeling computation
let label = await processor.formattedID()
```

## Good

```swift
actor OrderProcessor {
    let orderID: UUID
    private var status: OrderStatus = .pending

    init(orderID: UUID) {
        self.orderID = orderID
    }

    nonisolated func formattedID() -> String {
        "ORDER-\(orderID.uuidString.prefix(8))"
    }

    func updateStatus(_ newStatus: OrderStatus) {
        status = newStatus   // Still isolated — mutates actor state
    }
}

// No await needed — the compiler verified this doesn't touch isolated state
let label = processor.formattedID()
```

## nonisolated Requires No Access to Mutable Isolated State

```swift
actor Cache {
    let name: String                      // let constants are safe to read nonisolated
    private var storage: [String: Data] = [:]

    nonisolated var displayName: String {
        "Cache(\(name))"                  // OK: only touches a `let`
    }

    nonisolated func summary() -> String {
        // "storage.count" here would be a compile error:
        // nonisolated members cannot touch mutable actor-isolated state.
        return "Cache named \(name)"
    }
}
```

Use `nonisolated` for `let` properties, pure computations derived only from `let`s, and static/type-level members with no shared mutable state — it removes friction for callers without giving up any of the actor's safety guarantees.

## See Also

- [`async-actor-isolated-state`](async-actor-isolated-state.md) - the isolation this rule selectively opts out of
- [`async-global-actor-custom`](async-global-actor-custom.md) - nonisolated applies to custom global actors too
- [`mem-struct-value-semantics`](mem-struct-value-semantics.md) - pure value computations are naturally safe to expose this way
