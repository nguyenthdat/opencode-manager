# anti-any-overuse

> Don't overuse `Any`/`AnyObject` where concrete types/generics fit

## Why It Matters

`Any`/`AnyObject` erase all static type information, so the compiler can no longer catch type mismatches, autocomplete stops working at call sites, and every consumer has to cast back to a concrete type before doing anything useful — pushing a runtime `as?`/`as!` decision onto every caller instead of resolving the type once, correctly, at the boundary. Reaching for `Any` as a default "make it compile" escape hatch instead of a generic parameter or a protocol with an associated type quietly converts a compile-time-checked contract into a runtime guessing game.

## Bad

```swift
class EventBus {
    private var handlers: [String: (Any) -> Void] = [:]

    func subscribe(to event: String, handler: @escaping (Any) -> Void) {
        handlers[event] = handler
    }

    func publish(event: String, payload: Any) {
        handlers[event]?(payload)
    }
}

// Every subscriber must guess and cast the payload type:
bus.subscribe(to: "orderPlaced") { payload in
    guard let order = payload as? Order else { return }  // runtime guess, no compile-time link
    process(order)
}
```

## Good

```swift
struct EventBus<Event> {
    private var handlers: [(Event) -> Void] = []

    mutating func subscribe(handler: @escaping (Event) -> Void) {
        handlers.append(handler)
    }

    func publish(_ event: Event) {
        handlers.forEach { $0(event) }
    }
}

enum OrderEvent {
    case placed(Order)
    case cancelled(Order.ID)
}

var orderBus = EventBus<OrderEvent>()
orderBus.subscribe { event in
    switch event {
    case .placed(let order): process(order)      // compiler-verified, no casting
    case .cancelled(let id): handleCancellation(id)
    }
}
```

## When `Any` Is the Right Tool

Genuinely heterogeneous collections with no shared static type (a JSON tree, an arbitrary plist value, a bag of debug-metadata key/value pairs meant purely for logging) are legitimate uses of `Any`/`[String: Any]` — the anti-pattern is reaching for `Any` where a generic parameter or protocol would express the actual, known-in-advance contract:

```swift
// Genuinely heterogeneous: logging metadata has no fixed shape by design.
func log(_ message: String, metadata: [String: Any] = [:]) { /* ... */ }
```

## See Also

- [`api-protocol-associated-type`](api-protocol-associated-type.md) - the generic-contract alternative to `Any`
- [`api-existential-any`](api-existential-any.md) - when an existential `any Protocol` is the right, explicit tool
- [`interop-avoid-force-cast-anyobject`](interop-avoid-force-cast-anyobject.md) - the specific risk of casting bridged `Any`/`AnyObject`
- [`anti-stringly-typed`](anti-stringly-typed.md) - the same "erase real type information" anti-pattern in string form
