# async-mainactor-ui

> Mark UI-touching code `@MainActor`

## Why It Matters

UIKit, AppKit, and SwiftUI are not thread-safe: touching a view, view controller, or `@Published` UI state from a background thread causes glitches, crashes, or (worse) silent corruption that only shows up intermittently. `@MainActor` on a type, method, or closure statically guarantees — checked by the compiler — that its code only ever runs on the main thread, replacing fragile `DispatchQueue.main.async` calls sprinkled through the codebase with a declaration the compiler enforces.

## Bad

```swift
final class ProfileViewModel: ObservableObject {
    @Published var user: User?

    func load(id: String) {
        Task {
            let user = try? await fetchUser(id: id)
            // Mutating @Published state from a background context is unsafe;
            // this "usually" works but isn't guaranteed, and crashes under
            // strict concurrency checking in Swift 6.
            self.user = user
        }
    }
}
```

## Good

```swift
@MainActor
final class ProfileViewModel: ObservableObject {
    @Published var user: User?

    func load(id: String) async {
        let user = try? await fetchUser(id: id)
        self.user = user   // Guaranteed to run on the main actor
    }
}

struct ProfileView: View {
    @StateObject private var viewModel = ProfileViewModel()

    var body: some View {
        Text(viewModel.user?.name ?? "Loading…")
            .task { await viewModel.load(id: "42") }
    }
}
```

## Marking Just One Method, Not the Whole Type

```swift
final class ImageProcessor {
    // Heavy work stays off the main actor
    func process(_ data: Data) async -> UIImage {
        await Task.detached { decodeAndFilter(data) }.value
    }

    @MainActor
    func updatePreview(_ imageView: UIImageView, with image: UIImage) {
        imageView.image = image   // Only this touch of UI is main-actor isolated
    }
}

// Calling a @MainActor function from a non-isolated async context requires await
await processor.updatePreview(imageView, with: image)
```

`@MainActor` on a whole `ObservableObject`/view model is the common default for SwiftUI; reserve per-method `@MainActor` for classes that mix heavy background work with occasional UI updates.

## See Also

- [`async-actor-isolated-state`](async-actor-isolated-state.md) - the general actor-isolation mechanism this specializes
- [`async-global-actor-custom`](async-global-actor-custom.md) - defining your own global actor beyond MainActor
- [`ui-state-source-of-truth`](ui-state-source-of-truth.md) - where @MainActor view models fit into SwiftUI state
- [`anti-blocking-main-thread`](anti-blocking-main-thread.md) - don't defeat @MainActor by doing slow work on it
