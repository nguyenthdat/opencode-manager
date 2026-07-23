# ui-identifiable-list-data

> Conform list data to `Identifiable` instead of using indices

## Why It Matters

`ForEach(0..<items.count, id: \.self)` identifies each row by its position, so when items are inserted, removed, or reordered, SwiftUI's diffing can misattribute state (a text field's contents, a `.transition`, or animation) to the wrong row because indices shifted while the underlying data didn't move to a matching position. `Identifiable` gives each element a stable identity independent of its position, so SwiftUI's diffing tracks each item's own view/state correctly across insertions, deletions, and moves.

## Bad

```swift
struct Task {
    var title: String
    var isDone: Bool
}

struct TaskListView: View {
    @State private var tasks: [Task] = [
        Task(title: "Buy milk", isDone: false),
        Task(title: "Walk dog", isDone: false)
    ]

    var body: some View {
        List {
            ForEach(0..<tasks.count, id: \.self) { index in
                TaskRow(task: tasks[index])   // identity is the index — deleting task 0
                                              // makes every row "become" the next task's identity
            }
            .onDelete { tasks.remove(atOffsets: $0) }
        }
    }
}
```

## Good

```swift
struct Task: Identifiable {
    let id = UUID()
    var title: String
    var isDone: Bool
}

struct TaskListView: View {
    @State private var tasks: [Task] = [
        Task(title: "Buy milk", isDone: false),
        Task(title: "Walk dog", isDone: false)
    ]

    var body: some View {
        List {
            ForEach(tasks) { task in       // identity travels with the task, not its position
                TaskRow(task: task)
            }
            .onDelete { tasks.remove(atOffsets: $0) }
        }
    }
}
```

## Using an Existing Stable Field as the Identifier

When a model already has a natural stable key (a server-assigned ID), use it directly instead of introducing a redundant `UUID`:

```swift
struct RemoteUser: Identifiable, Decodable {
    let id: Int   // server-assigned, stable, already unique
    let name: String
}
```

Avoid `id: \.self` on value types whose content can change (two tasks with the same title momentarily) — that reintroduces the same misidentification problem `Identifiable` is meant to solve.

## See Also

- [`ui-view-small-composable`](ui-view-small-composable.md) - list rows are a common extraction target
- [`api-equatable-hashable-derive`](api-equatable-hashable-derive.md) - deriving conformances alongside Identifiable
- [`ui-state-source-of-truth`](ui-state-source-of-truth.md) - keeping the list itself as one source of truth
