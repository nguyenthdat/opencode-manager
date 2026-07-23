# ui-task-modifier-async

> Use the `.task {}` modifier for view-lifecycle-scoped async work

## Why It Matters

Starting an unstructured `Task { }` from `onAppear` ties nothing to the view's actual lifetime: if the view disappears before the work finishes, the task keeps running, potentially mutating state that no longer has a visible view to update, or racing with a new task started the next time the view appears. The `.task {}` modifier creates a task scoped to the view's appearance and automatically cancels it when the view disappears, so long-running async work is cleaned up in lockstep with what's on screen.

## Bad

```swift
struct WeatherView: View {
    @State private var forecast: Forecast?

    var body: some View {
        Group {
            if let forecast {
                Text(forecast.summary)
            } else {
                ProgressView()
            }
        }
        .onAppear {
            Task {
                forecast = try? await WeatherService.fetch()
                // if the view disappears before this completes, the task keeps
                // running and later writes to `forecast` on a gone-away view
            }
        }
    }
}
```

## Good

```swift
struct WeatherView: View {
    @State private var forecast: Forecast?

    var body: some View {
        Group {
            if let forecast {
                Text(forecast.summary)
            } else {
                ProgressView()
            }
        }
        .task {
            forecast = try? await WeatherService.fetch()   // cancelled automatically on disappear
        }
    }
}
```

## Re-running on an Identity Change

`.task(id:)` restarts the async work whenever the given value changes, which is the correct way to refetch when a parameter (like a selected item) changes instead of manually diffing in `onChange`:

```swift
struct WeatherView: View {
    let cityID: String
    @State private var forecast: Forecast?

    var body: some View {
        Group {
            if let forecast {
                Text(forecast.summary)
            } else {
                ProgressView()
            }
        }
        .task(id: cityID) {
            forecast = try? await WeatherService.fetch(city: cityID)
        }
    }
}
```

Check `Task.isCancelled`/use cancellation-aware APIs (like `URLSession`'s async methods, which already respond to cancellation) inside long-running `.task` bodies so cancellation actually stops the work promptly rather than merely discarding its eventual result.

## See Also

- [`async-task-cancellation-check`](async-task-cancellation-check.md) - responding to cancellation inside the task body
- [`async-mainactor-ui`](async-mainactor-ui.md) - ensuring the resulting state writes land on the main actor
- [`ui-no-business-logic-in-view`](ui-no-business-logic-in-view.md) - keeping the fetch logic itself out of the view when it grows complex
