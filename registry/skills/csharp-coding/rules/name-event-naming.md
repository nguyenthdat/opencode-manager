# name-event-naming

> Name events with a verb phrase describing what happened; name handler methods with an `On` prefix

## Why It Matters

Events represent something that occurred (past-tense-flavored, though C# convention uses present-participle verb phrases like `Clicked`/`Closing`), and following the `EventHandler`/`EventArgs` pattern with consistent naming makes event-driven code predictable to read and wire up, matching the BCL's own event-naming conventions.

## Bad

```csharp
public class Button
{
    public event EventHandler Click; // ambiguous: about to happen, or already happened?
    public event EventHandler DataChange; // should be past/gerund form
}

public void ButtonClick(object sender, EventArgs e) { /* ... */ } // handler missing On prefix
```

## Good

```csharp
public class Button
{
    public event EventHandler? Clicked;              // already happened
    public event EventHandler<CancelEventArgs>? Closing; // about to happen, cancellable
    public event EventHandler<DataChangedEventArgs>? DataChanged;

    protected virtual void OnClicked() => Clicked?.Invoke(this, EventArgs.Empty);
}

public void OnButtonClicked(object? sender, EventArgs e) { /* ... */ } // handler follows the On prefix convention
```

## Custom EventArgs

```csharp
public sealed class DataChangedEventArgs(string propertyName, object? oldValue, object? newValue) : EventArgs
{
    public string PropertyName { get; } = propertyName;
    public object? OldValue { get; } = oldValue;
    public object? NewValue { get; } = newValue;
}

public event EventHandler<DataChangedEventArgs>? DataChanged;
```

## Cancellable "Before" Events

```csharp
public class FileWatcher
{
    // "-ing" form signals "about to happen" and pairs with a CancelEventArgs
    // to let subscribers veto the operation.
    public event EventHandler<CancelEventArgs>? Deleting;
    public event EventHandler? Deleted;
}
```

## See Also

- [name-pascalcase-public](name-pascalcase-public.md) - General naming conventions
- [async-no-async-void](async-no-async-void.md) - async void is acceptable specifically for event handlers
