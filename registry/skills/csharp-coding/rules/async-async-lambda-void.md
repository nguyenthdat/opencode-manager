# async-async-lambda-void

> Avoid assigning an `async` lambda to an `Action`/`Action<T>`-typed delegate - it becomes `async void`

## Why It Matters

When an `async` lambda's target delegate type is `Action` (not `Func<Task>`), the compiler generates an `async void` lambda under the hood, with all the same problems as an `async void` method: exceptions can't be caught by the caller, and there's no way to await its completion. This most often happens accidentally with LINQ `ForEach`, event subscriptions, or APIs that take `Action`.

## Bad

```csharp
// List<T>.ForEach takes Action<T> - this compiles but creates async void lambdas
items.ForEach(async item => await ProcessAsync(item));
// Exceptions from ProcessAsync are unobservable here, and ForEach returns
// before any of the async work actually completes.

button.Click += async (s, e) => await SaveAsync(); // also async void - see async-no-async-void
```

## Good

```csharp
// Use a real async-aware iteration instead of Action-based ForEach
foreach (var item in items)
{
    await ProcessAsync(item);
}

// Or run them concurrently and await the combined completion
await Task.WhenAll(items.Select(ProcessAsync));
```

## Watch for APIs That Only Accept Action

```csharp
// If a third-party API only accepts Action, don't pass an async lambda directly -
// dispatch to a properly awaited/observed Task instead.
public void Subscribe(Action<Event> handler) { /* ... */ }

// BAD
subscription.Subscribe(async e => await HandleAsync(e));

// BETTER: fire-and-forget explicitly, with its own exception handling
subscription.Subscribe(e => _ = HandleSafelyAsync(e));

private async Task HandleSafelyAsync(Event e)
{
    try
    {
        await HandleAsync(e);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to handle event");
    }
}
```

## Detecting It

```text
Roslyn analyzer VSTHRD100/VSTHRD101 (Microsoft.VisualStudio.Threading.Analyzers)
flags async void methods and async lambdas assigned to non-Task-returning
delegate types - enable it in CI to catch this class of bug automatically.
```

## See Also

- [async-no-async-void](async-no-async-void.md) - The root problem this stems from
- [err-async-exception-propagation](err-async-exception-propagation.md) - How exceptions actually flow (or don't) here
