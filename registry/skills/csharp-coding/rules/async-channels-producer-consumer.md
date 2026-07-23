# async-channels-producer-consumer

> Use `System.Threading.Channels` for async producer/consumer pipelines instead of hand-rolled queues and signals

## Why It Matters

Coordinating one or more producers with one or more consumers using raw locks, `ManualResetEventSlim`, or a `ConcurrentQueue<T>` polled in a loop is easy to get subtly wrong (busy-waiting, missed signals, unbounded memory growth). `System.Threading.Channels` provides a fully async-aware, optionally-bounded queue with built-in backpressure and completion signaling.

## Bad

```csharp
private readonly ConcurrentQueue<Message> _queue = new();
private readonly ManualResetEventSlim _signal = new();

public void Produce(Message message)
{
    _queue.Enqueue(message);
    _signal.Set();
}

public async Task ConsumeAsync(CancellationToken ct)
{
    while (!ct.IsCancellationRequested)
    {
        if (_queue.TryDequeue(out var message))
        {
            await ProcessAsync(message);
        }
        else
        {
            await Task.Run(() => _signal.Wait(100)); // polling, blocking a thread
        }
    }
}
```

## Good

```csharp
public sealed class MessagePipeline
{
    private readonly Channel<Message> _channel = Channel.CreateBounded<Message>(
        new BoundedChannelOptions(capacity: 1000)
        {
            FullMode = BoundedChannelFullMode.Wait // producers await when full - built-in backpressure
        });

    public ValueTask ProduceAsync(Message message, CancellationToken ct) =>
        _channel.Writer.WriteAsync(message, ct);

    public void CompleteProducing() => _channel.Writer.Complete();

    public async Task ConsumeAsync(CancellationToken ct)
    {
        await foreach (var message in _channel.Reader.ReadAllAsync(ct))
        {
            await ProcessAsync(message);
        }
    }
}
```

## Multiple Consumers Reading the Same Channel

```csharp
public async Task RunConsumersAsync(MessagePipeline pipeline, int consumerCount, CancellationToken ct)
{
    var consumers = Enumerable.Range(0, consumerCount)
        .Select(_ => pipeline.ConsumeAsync(ct));

    await Task.WhenAll(consumers); // each consumer competes for items from the same channel
}
```

## Unbounded Channels

```csharp
// Only use an unbounded channel when producers are guaranteed to be slower than
// consumers, or memory growth is genuinely acceptable - otherwise prefer bounded.
var unbounded = Channel.CreateUnbounded<Message>();
```

## See Also

- [async-iasyncenumerable-streaming](async-iasyncenumerable-streaming.md) - Consuming a channel reader as a stream
- [async-semaphoreslim-lock](async-semaphoreslim-lock.md) - Simpler async coordination for mutual exclusion
- [async-cancellationtoken-propagate](async-cancellationtoken-propagate.md) - Threading cancellation into the pipeline
