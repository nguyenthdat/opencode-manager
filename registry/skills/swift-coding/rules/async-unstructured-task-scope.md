# async-unstructured-task-scope

> Scope unstructured `Task {}` explicitly; avoid detached leaks

## Why It Matters

`Task { ... }` and `Task.detached { ... }` create *unstructured* concurrency: unlike `async let` or `TaskGroup`, nothing automatically ties their lifetime to the scope that created them, and nothing automatically cancels them when that scope goes away. Every unstructured task you create is a task you're now responsible for cancelling and tracking yourself — skip that and it's a leak.

## Bad

```swift
final class NotificationCenter {
    func handleEvent(_ event: Event) {
        // Fire-and-forget: nobody holds a reference, nobody can cancel it,
        // and it inherits no useful context from the caller.
        Task.detached {
            await self.processInBackground(event)
        }
    }
}
```

## Good

```swift
final class NotificationCenter {
    private var activeTasks: Set<Task<Void, Never>> = []

    func handleEvent(_ event: Event) {
        let task = Task {
            await processInBackground(event)
        }
        activeTasks.insert(task)
        Task { [weak self] in
            _ = await task.value
            self?.activeTasks.remove(task)
        }
    }

    func cancelAll() {
        for task in activeTasks { task.cancel() }
        activeTasks.removeAll()
    }
}
```

## Task {} vs Task.detached {}

```swift
@MainActor
final class ViewModel {
    func refresh() {
        // Task {} inherits the current actor context (MainActor here)
        // and the current task's priority — usually what you want.
        Task {
            await self.reload()   // Still hops correctly since it inherits MainActor
        }

        // Task.detached inherits nothing: no actor context, no priority,
        // no task-local values. Only use it when you specifically need
        // to escape the calling context, e.g. a truly independent background job.
        Task.detached(priority: .background) {
            await self.writeAnalyticsLog()
        }
    }
}
```

Prefer plain `Task { ... }` (which inherits context) over `Task.detached` by default; reserve `.detached` for work that must run independently of the caller's actor and priority, and always keep a handle you can cancel when the owning object's lifetime ends.

## See Also

- [`async-task-cancel-cleanup`](async-task-cancel-cleanup.md) - cancelling tasks in deinit
- [`async-structured-taskgroup`](async-structured-taskgroup.md) - the structured alternative when possible
- [`async-mainactor-ui`](async-mainactor-ui.md) - why context inheritance matters for UI-touching tasks
