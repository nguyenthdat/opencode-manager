# test-avoid-thread-sleep

> Never use `Thread.Sleep`/`Task.Delay` to synchronize with async work in tests; await the actual completion signal

## Why It Matters

Sleeping for a fixed duration is both slow (you always wait the full timeout, even when the work finishes instantly) and flaky (if the work occasionally takes longer than the sleep, under CI load or on a slower machine, the test fails intermittently for reasons unrelated to the code being tested).

## Bad

```csharp
[Fact]
public async Task ProcessesQueuedMessage()
{
    var processor = new BackgroundMessageProcessor();
    processor.Enqueue(new Message("test"));

    await Task.Delay(500); // hope 500ms is enough - flaky under CI load, wasteful when it's not needed

    Assert.True(processor.WasProcessed("test"));
}
```

## Good

```csharp
[Fact]
public async Task ProcessesQueuedMessage()
{
    var processor = new BackgroundMessageProcessor();
    var processedSignal = new TaskCompletionSource();
    processor.MessageProcessed += (_, _) => processedSignal.TrySetResult();

    processor.Enqueue(new Message("test"));

    await processedSignal.Task.WaitAsync(TimeSpan.FromSeconds(5)); // waits exactly as long as needed, times out loudly if truly stuck

    Assert.True(processor.WasProcessed("test"));
}
```

## Testing Async Methods Directly

```csharp
// If the method under test is itself async, just await it - no synchronization
// hack needed at all.
[Fact]
public async Task ProcessAsync_MarksOrderAsProcessed()
{
    var processor = new OrderProcessor();

    await processor.ProcessAsync(order);

    Assert.Equal(OrderStatus.Processed, order.Status);
}
```

## Polling With a Timeout as a Last Resort

```csharp
// When no completion signal is available at all (e.g. testing eventual
// consistency in an external system), poll with a bounded timeout rather
// than a single fixed sleep - still flaky in principle, but far less so,
// and fails fast on the happy path instead of always waiting the max duration.
async Task WaitUntilAsync(Func<bool> condition, TimeSpan timeout)
{
    var deadline = DateTime.UtcNow + timeout;
    while (!condition() && DateTime.UtcNow < deadline)
    {
        await Task.Delay(50);
    }
    Assert.True(condition(), "Condition was not met within the timeout.");
}
```

## See Also

- [async-cancellationtoken-propagate](async-cancellationtoken-propagate.md) - Cancellation for the code under test
- [async-taskcompletionsource-bridge](async-taskcompletionsource-bridge.md) - TaskCompletionSource fundamentals
