# interop-objc-selector-safe

> Use `#selector` for compile-time-checked selectors

## Why It Matters

`Selector("methodName:")` built from a string literal is invisible to the compiler: rename the method, delete it, or typo the string, and the mistake surfaces only at runtime as a silent no-op (`Target does not respond to selector`) or a crash, often far from the call site that's actually wrong. `#selector(...)` forces the compiler to resolve the expression against a real, `@objc`-exposed declaration, so renames and typos become build errors immediately, and refactoring tools (rename symbol) update the selector along with the method.

## Bad

```swift
class SettingsViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        let button = UIButton(type: .system)
        button.addTarget(self, action: Selector("handleSaveTapped"), for: .touchUpInside)
        //                            ^ string literal — no compiler check, breaks silently on rename
    }

    @objc func handleSaveTapped() { /* ... */ }
}
```

## Good

```swift
class SettingsViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        let button = UIButton(type: .system)
        button.addTarget(self, action: #selector(handleSaveTapped), for: .touchUpInside)
        //                            ^ compiler-verified reference to an @objc method
    }

    @objc func handleSaveTapped() { /* ... */ }
}
```

## Disambiguating Overloaded Selectors

When a method is overloaded, `#selector` needs an explicit type signature to pick the right overload — this is one of the few places Swift syntax intentionally gets verbose to stay type-safe:

```swift
class Logger: NSObject {
    @objc func log(_ message: String) { /* ... */ }
    @objc func log(_ message: String, level: Int) { /* ... */ }
}

// Ambiguous without a signature — must disambiguate explicitly:
let selector = #selector(Logger.log(_:) as (Logger) -> (String) -> Void)
```

Also remember `#selector` only works against members marked `@objc` (or `@objcMembers` types); a plain Swift method has no selector to reference, which is itself a useful compile-time signal that the target isn't actually exposed to the Objective-C runtime.

## See Also

- [`interop-objc-expose-minimal`](interop-objc-expose-minimal.md) - only `@objc`-exposed members produce a valid `#selector`
- [`interop-avoid-force-cast-anyobject`](interop-avoid-force-cast-anyobject.md) - another compile-time-safety trade Objective-C interop requires
- [`mem-avoid-retain-cycle-timer`](mem-avoid-retain-cycle-timer.md) - `#selector` targets are common on `Timer`/`NotificationCenter` APIs
