# anti-blocking-main-thread

> Don't block the main thread with synchronous long work

## Why It Matters

The main thread is responsible for rendering every frame and responding to every touch event; any synchronous work that runs on it for more than a handful of milliseconds — a blocking network call, disk I/O, a heavy computation, or a `DispatchSemaphore.wait()` used to fake synchronous behavior — freezes the UI, drops frames, and past roughly 5 seconds can trigger the watchdog to kill the app outright. Because the symptom (a frozen UI or a watchdog termination) shows up disconnected from the actual blocking call, this class of bug is disproportionately expensive to diagnose after the fact compared to how cheap it is to avoid up front.

## Bad

```swift
@MainActor
final class ProfileViewModel {
    func loadProfile(id: String) -> Profile {
        let semaphore = DispatchSemaphore(value: 0)
        var result: Profile!
        URLSession.shared.dataTask(with: profileURL(id)) { data, _, _ in
            result = try? JSONDecoder().decode(Profile.self, from: data ?? Data())
            semaphore.signal()
        }.resume()
        semaphore.wait()   // blocks the main thread until the network call returns
        return result
    }
}
```

## Good

```swift
@MainActor
final class ProfileViewModel {
    func loadProfile(id: String) async throws -> Profile {
        let (data, _) = try await URLSession.shared.data(from: profileURL(id))
        return try JSONDecoder().decode(Profile.self, from: data)
        // suspends without blocking the thread — UI stays responsive during the await
    }
}
```

## Offloading CPU-Bound Work, Not Just I/O

Blocking isn't only network/disk calls — a genuinely CPU-heavy synchronous computation (image processing, large-data parsing) run directly on `@MainActor` blocks just as badly. Move it to a background executor and hop back to the main actor only for the final UI update:

```swift
@MainActor
final class ImageProcessor {
    func process(_ image: UIImage) async -> UIImage {
        await Task.detached(priority: .userInitiated) {
            applyExpensiveFilter(image)   // runs off the main actor
        }.value
        // implicit hop back to @MainActor on return, since this method is @MainActor
    }
}
```

## See Also

- [`async-no-blocking-in-async`](async-no-blocking-in-async.md) - the positive-form rule this anti-pattern violates
- [`async-await-over-completion`](async-await-over-completion.md) - replacing the semaphore-bridging pattern with real `async`/`await`
- [`async-mainactor-ui`](async-mainactor-ui.md) - correctly scoping what actually needs `@MainActor`
- [`anti-nested-completion-handlers`](anti-nested-completion-handlers.md) - another symptom of not adopting structured concurrency
