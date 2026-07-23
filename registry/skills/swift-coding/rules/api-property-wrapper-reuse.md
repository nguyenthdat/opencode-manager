# api-property-wrapper-reuse

> Use property wrappers to encapsulate reusable behavior

## Why It Matters

Property wrappers let you factor out a storage pattern (clamping, persistence, validation, thread-safety) into a single reusable type, so callers just annotate a property instead of repeating the same getter/setter logic on every property that needs it. Without a wrapper, every property with the same cross-cutting concern duplicates its accessor logic, and fixing a bug in that logic means hunting down every copy.

## Bad

```swift
struct AudioSettings {
    private var _volume: Double = 0.5

    var volume: Double {
        get { _volume }
        set { _volume = min(max(newValue, 0), 1) }   // clamping logic inlined
    }

    private var _brightness: Double = 0.5

    var brightness: Double {
        get { _brightness }
        set { _brightness = min(max(newValue, 0), 1) }   // duplicated clamping logic
    }
}
```

## Good

```swift
@propertyWrapper
struct Clamped<Value: Comparable> {
    private var value: Value
    let range: ClosedRange<Value>

    init(wrappedValue: Value, _ range: ClosedRange<Value>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }

    var wrappedValue: Value {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }
}

struct AudioSettings {
    @Clamped(0...1) var volume: Double = 0.5
    @Clamped(0...1) var brightness: Double = 0.5
}

var settings = AudioSettings()
settings.volume = 5.0   // clamped to 1.0 automatically
```

## Exposing the Wrapper's Projected Value

A property wrapper can expose additional API through `$propertyName` (the projected value) — useful for SwiftUI's `@State`/`@Binding` style APIs or for surfacing wrapper-specific operations:

```swift
@propertyWrapper
struct UserDefault<Value> {
    let key: String
    let defaultValue: Value
    var store: UserDefaults = .standard

    var wrappedValue: Value {
        get { store.object(forKey: key) as? Value ?? defaultValue }
        set { store.set(newValue, forKey: key) }
    }

    var projectedValue: UserDefault<Value> { self }   // exposes $isDarkMode for advanced access
}

struct AppSettings {
    @UserDefault(key: "isDarkMode", defaultValue: false) var isDarkMode: Bool
}
```

Reach for a property wrapper when the same accessor pattern repeats across three or more properties; for a one-off, a computed property is simpler and clearer.

## See Also

- [`ui-state-source-of-truth`](ui-state-source-of-truth.md) - SwiftUI's own property wrappers for state
- [`ui-observable-macro`](ui-observable-macro.md) - `@Observable` as a macro-based alternative to wrapper-based observation
- [`api-immutable-by-default`](api-immutable-by-default.md) - reserving `var`/wrappers for state that truly needs to mutate
