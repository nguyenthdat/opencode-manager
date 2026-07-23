# async-no-async-void

> Avoid `async void`; use `async Task` everywhere except top-level UI event handlers

## Why It Matters

`async void` methods can't be awaited, so callers have no way to know when the work completes or whether it failed. Any exception thrown inside an `async void` method is raised directly on the `SynchronizationContext` (or crashes the process if there is none) - it cannot be caught by a `try/catch` around the call site.

## Bad

```csharp
public class OrderProcessor
{
    public async void ProcessOrder(Order order) // caller can't await or catch failures
    {
        await _repository.SaveAsync(order);
        await _emailer.SendConfirmationAsync(order);
    }
}

// Caller has no way to know this failed or even completed
processor.ProcessOrder(order);
Console.WriteLine("Done"); // may print before ProcessOrder even finishes
```

## Good

```csharp
public class OrderProcessor
{
    public async Task ProcessOrderAsync(Order order)
    {
        await _repository.SaveAsync(order);
        await _emailer.SendConfirmationAsync(order);
    }
}

await processor.ProcessOrderAsync(order);
Console.WriteLine("Done"); // guaranteed to run after ProcessOrderAsync completes
```

## The One Legitimate Use: Event Handlers

```csharp
// UI event handler signatures are fixed by the framework (EventHandler) and
// cannot return Task - async void is the only option here.
private async void OnSaveButtonClicked(object sender, RoutedEventArgs e)
{
    saveButton.IsEnabled = false;
    try
    {
        await SaveDocumentAsync();
    }
    catch (Exception ex)
    {
        // Must catch everything HERE - nothing else can catch it for an async void method
        ShowErrorDialog(ex.Message);
    }
    finally
    {
        saveButton.IsEnabled = true;
    }
}
```

## Testing async void Is Hard

```csharp
// Unit tests can't await an async void method, making it effectively untestable
// in isolation - another reason to keep production logic in async Task methods
// and reserve async void strictly for the framework-mandated handler shim.
```

## See Also

- [async-configureawait-false-lib](async-configureawait-false-lib.md) - Related context-capture concern
- [err-async-exception-propagation](err-async-exception-propagation.md) - How exceptions flow from Task methods
- [anti-async-void](anti-async-void.md) - Anti-pattern reference
