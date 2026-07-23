# async-task-cancel-cleanup

> Cancel tasks explicitly and clean up in `deinit`

## Why It Matters

An unstructured `Task` you store a handle to (e.g. one kicked off from `viewDidLoad` or an actor's `init`) keeps running even after the object that started it is deallocated, unless you cancel it yourself — usually in `deinit`. Forgetting this leaks work: a view model that's gone still fires network requests and tries to mutate state nobody will ever read, and in the worst case retains resources or crashes trying to update a deallocated UI.

## Bad

```swift
@MainActor
final class SearchViewModel: ObservableObject {
    @Published var results: [Result] = []

    func search(_ query: String) {
        Task {
            // No handle kept, nothing cancels this if the view model
            // is deallocated mid-search — it keeps running to completion.
            let results = try? await api.search(query)
            self.results = results ?? []
        }
    }
}
```

## Good

```swift
@MainActor
final class SearchViewModel: ObservableObject {
    @Published var results: [Result] = []
    private var searchTask: Task<Void, Never>?

    func search(_ query: String) {
        searchTask?.cancel()   // Cancel any in-flight previous search
        searchTask = Task {
            do {
                results = try await api.search(query)
            } catch is CancellationError {
                // Superseded by a newer search — nothing to do
            } catch {
                results = []
            }
        }
    }

    deinit {
        searchTask?.cancel()
    }
}
```

## Cleaning Up Multiple Tasks

```swift
final class DownloadManager {
    private var activeTasks: [UUID: Task<Void, Never>] = [:]

    func startDownload(_ id: UUID, url: URL) {
        activeTasks[id] = Task {
            defer { activeTasks[id] = nil }
            await download(url)
        }
    }

    func cancelAll() {
        for task in activeTasks.values {
            task.cancel()
        }
        activeTasks.removeAll()
    }

    deinit {
        cancelAll()
    }
}
```

Keeping a `Task` handle around costs one property; the alternative — an orphaned task nobody can cancel — is a slow, silent resource leak that's hard to spot until it shows up as excess network traffic or battery drain.

## See Also

- [`async-task-cancellation-check`](async-task-cancellation-check.md) - make the task's own work responsive to cancellation
- [`async-unstructured-task-scope`](async-unstructured-task-scope.md) - scoping Task {} lifetimes deliberately
- [`mem-deinit-verify`](mem-deinit-verify.md) - confirming deinit actually runs and cleans up
