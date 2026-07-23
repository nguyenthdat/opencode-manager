# ui-observable-macro

> Use the `@Observable` macro over legacy `ObservableObject` for new code

## Why It Matters

`ObservableObject` combined with `@Published` tracks changes per-property but notifies observers on *any* published property change, so a view reading only one property still re-renders when an unrelated property on the same object changes. The `@Observable` macro (Swift 5.9+/iOS 17+) instruments property access at the point each view actually reads it, so SwiftUI only re-renders a view when a property it genuinely read changes — less boilerplate and fewer unnecessary re-renders.

## Bad

```swift
final class ProfileModel: ObservableObject {
    @Published var name: String = ""
    @Published var bio: String = ""
    @Published var followerCount: Int = 0
}

struct FollowerBadge: View {
    @ObservedObject var model: ProfileModel   // re-renders on ANY published change,
                                               // even though it only reads followerCount
    var body: some View {
        Text("\(model.followerCount) followers")
    }
}
```

## Good

```swift
@Observable
final class ProfileModel {
    var name: String = ""
    var bio: String = ""
    var followerCount: Int = 0
}

struct FollowerBadge: View {
    let model: ProfileModel   // no property wrapper needed

    var body: some View {
        Text("\(model.followerCount) followers")   // only re-renders when followerCount changes
    }
}
```

## Owning vs. Observing an `@Observable` Model

Use `@State` in the owning view to create and keep the model alive across body re-evaluations; pass it down as a plain `let`/parameter to child views that only read it:

```swift
struct ProfileScreen: View {
    @State private var model = ProfileModel()

    var body: some View {
        VStack {
            FollowerBadge(model: model)
            Button("Follow") { model.followerCount += 1 }
        }
    }
}
```

Keep `ObservableObject`/`@Published` for targets still on a minimum deployment target below iOS 17/macOS 14; there's no reason to migrate working legacy code purely for its own sake, but all new models should use `@Observable`.

## See Also

- [`ui-state-source-of-truth`](ui-state-source-of-truth.md) - the single-source-of-truth principle this macro supports
- [`ui-environment-dependency`](ui-environment-dependency.md) - sharing an `@Observable` model via `@Environment`
- [`mem-class-when-identity`](mem-class-when-identity.md) - why `@Observable` models are reference types
