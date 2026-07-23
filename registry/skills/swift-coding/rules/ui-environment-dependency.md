# ui-environment-dependency

> Use `@Environment`/`@EnvironmentObject` for ambient dependencies

## Why It Matters

Passing a widely-needed dependency (a theme, a logged-in user session, a networking client) explicitly through every intermediate view's initializer creates "prop drilling": views three or four levels removed from where the value is used still have to accept and forward it, bloating their signatures with parameters they don't care about. `@Environment` injects a value ambiently down the view hierarchy, so only the views that actually read the dependency need to know it exists.

## Bad

```swift
struct RootView: View {
    let session: UserSession

    var body: some View {
        DashboardView(session: session)   // must forward, even if it doesn't use it directly
    }
}

struct DashboardView: View {
    let session: UserSession   // only exists to pass through

    var body: some View {
        ProfileHeader(session: session)
    }
}

struct ProfileHeader: View {
    let session: UserSession   // the only view that actually needs it

    var body: some View {
        Text(session.currentUser.name)
    }
}
```

## Good

```swift
struct RootView: View {
    let session: UserSession

    var body: some View {
        DashboardView()
            .environment(session)   // injected once at the root
    }
}

struct DashboardView: View {
    var body: some View {
        ProfileHeader()   // no need to know about `session` at all
    }
}

struct ProfileHeader: View {
    @Environment(UserSession.self) private var session

    var body: some View {
        Text(session.currentUser.name)
    }
}
```

## Built-in Environment Values

Use `@Environment` for SwiftUI's own ambient values too (`colorScheme`, `dismiss`, `locale`), which follow the same pattern as custom `@Observable` injections:

```swift
struct DetailView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button("Close") { dismiss() }
            .foregroundStyle(colorScheme == .dark ? .white : .black)
    }
}
```

Reserve `@Environment` for genuinely ambient, cross-cutting dependencies; state that's local to one screen's flow should still be passed explicitly (or via `@Binding`) so the data flow stays traceable.

## See Also

- [`ui-observable-macro`](ui-observable-macro.md) - the `@Observable` models typically injected via environment
- [`ui-state-source-of-truth`](ui-state-source-of-truth.md) - environment values still trace back to one owning source
- [`ui-view-small-composable`](ui-view-small-composable.md) - environment injection is what keeps small subviews from needing bloated initializers
