# anti-async-void

> Don't use `async void` outside of framework-mandated event handlers

## Why It Matters

An `async void` method's exceptions can't be caught by a `try/catch` around the call site - they propagate directly to the `SynchronizationContext` or crash the process, and the caller has no `Task` to await, so it can't know when (or whether) the work actually finished.

## Bad

```csharp
public class OrderProcessor
{
    public async void ProcessOrder(Order order) // caller can't await or catch failures
    {
        await _repository.SaveAsync(order);
        await _emailer.SendConfirmationAsync(order); // if this throws, it crashes the process
    }
}

processor.ProcessOrder(order); // fire-and-forget with no way to observe completion or failure
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

await processor.ProcessOrderAsync(order); // awaitable, exceptions propagate normally to the caller
```

## The One Exception

```csharp
// UI event handlers are the sole legitimate case, because their delegate
// signature (EventHandler) is fixed by the framework and can't return Task.
private async void OnSaveClicked(object sender, RoutedEventArgs e)
{
    try
    {
        await SaveAsync();
    }
    catch (Exception ex)
    {
        ShowError(ex.Message); // MUST catch everything here - nothing else can
    }
}
```

## See Also

- [async-no-async-void](async-no-async-void.md) - The full rule with more detail
- [err-async-exception-propagation](err-async-exception-propagation.md) - How exceptions actually flow from Task methods
