# api-composition-over-inheritance

> Compose protocols/structs instead of deep class hierarchies

## Why It Matters

Deep class hierarchies couple unrelated behaviors into a single rigid chain: a subclass inherits everything its superclass has, whether or not it wants it, and inserting new behavior into the middle of the hierarchy risks breaking every class below it. Composing small protocols and delegating to owned struct/class properties lets a type mix in exactly the behaviors it needs, independently, without inheriting unrelated baggage or committing to one fixed ancestor chain.

## Bad

```swift
class Animal {
    func move() { print("moving") }
}

class FlyingAnimal: Animal {
    func fly() { print("flying") }
}

class SwimmingAnimal: Animal {
    func swim() { print("swimming") }
}

// A duck needs both flying and swimming — but Swift classes only have one
// superclass, so the hierarchy has to be twisted or duplicated to fit.
class Duck: FlyingAnimal {
    func swim() { print("swimming, duplicated from SwimmingAnimal") }
}
```

## Good

```swift
protocol Movable { func move() }
protocol Flyable { func fly() }
protocol Swimmable { func swim() }

struct Duck: Movable, Flyable, Swimmable {
    func move() { print("waddling") }
    func fly() { print("flying") }
    func swim() { print("swimming") }
}

struct Fish: Movable, Swimmable {
    func move() { print("gliding") }
    func swim() { print("swimming") }
}
```

## Composing Behavior via Owned Properties

When a capability needs shared mutable state (not just a method), compose by holding an instance of a dedicated type rather than inheriting from a class that provides it:

```swift
struct Logger {
    func log(_ message: String) { print("[LOG] \(message)") }
}

struct OrderProcessor {
    private let logger = Logger()   // composition: has-a Logger, not is-a LoggingBase

    func process(_ order: Order) {
        logger.log("processing order \(order.id)")
        // ...
    }
}
```

## See Also

- [`api-protocol-oriented`](api-protocol-oriented.md) - protocols as the primary composition unit
- [`mem-final-class-default`](mem-final-class-default.md) - closing off inheritance where composition is the intended tool
- [`anti-god-protocol`](anti-god-protocol.md) - the failure mode of composing too much into one contract instead
