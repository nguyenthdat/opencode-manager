# ui-binding-two-way

> Use `@Binding` for child-to-parent two-way state

## Why It Matters

A child view that needs to both read and write a piece of state it doesn't own has no way to propagate changes back up if it only receives a plain value — any local copy it mutates is disconnected from the parent's actual state. `@Binding` gives the child a reference to the parent's storage itself, so edits the child makes are immediately reflected in the parent (and any other view sharing that same source of truth), without the child needing to own the state or the parent needing a callback closure for every field.

## Bad

```swift
struct SettingsScreen: View {
    @State private var isDarkMode = false

    var body: some View {
        ToggleRow(isDarkMode: isDarkMode)   // passed by value: the child can't affect the parent
    }
}

struct ToggleRow: View {
    var isDarkMode: Bool   // a local copy — toggling this does nothing to SettingsScreen

    var body: some View {
        Toggle("Dark Mode", isOn: .constant(isDarkMode))   // can't actually update anything
    }
}
```

## Good

```swift
struct SettingsScreen: View {
    @State private var isDarkMode = false

    var body: some View {
        ToggleRow(isDarkMode: $isDarkMode)   // pass the binding, not the value
    }
}

struct ToggleRow: View {
    @Binding var isDarkMode: Bool

    var body: some View {
        Toggle("Dark Mode", isOn: $isDarkMode)   // mutates the parent's @State directly
    }
}
```

## Deriving a Binding From a Model Property

`@Bindable` (Swift 5.9+) exposes `$`-prefixed bindings directly on `@Observable` model properties, so a view can bind into a shared model without the model itself needing `@State`:

```swift
@Observable
final class UserPreferences {
    var isDarkMode = false
}

struct SettingsScreen: View {
    @Bindable var preferences: UserPreferences

    var body: some View {
        Toggle("Dark Mode", isOn: $preferences.isDarkMode)
    }
}
```

## See Also

- [`ui-state-source-of-truth`](ui-state-source-of-truth.md) - the parent-owned state a binding points back to
- [`ui-observable-macro`](ui-observable-macro.md) - `@Bindable` as the modern binding mechanism for observable models
- [`ui-view-small-composable`](ui-view-small-composable.md) - bindings are what make small extracted subviews practical
