# perf-string-interpolation-vs-concat

> Understand how interpolated strings compile so you can predict their allocation behavior

## Why It Matters

Modern C# compiles an interpolated string (`$"..."`) differently depending on context: for a plain `string` result it typically becomes a `string.Format`/`string.Concat`/`DefaultInterpolatedStringHandler`-based call, but when the target is `ILogger`-style structured logging or a `Span<char>` destination, the compiler can avoid allocating an intermediate string entirely. Knowing this helps you choose the right form for hot paths instead of guessing.

## Bad

```csharp
// Manually pre-formatting into a string just to hand it to structured logging
// throws away the structured, allocation-avoiding path the logger provides.
_logger.LogInformation($"Processed order {order.Id} for {order.Total:C}");
// This IS actually fine with ILogger's interpolated string handler support in
// recent versions, but manually building the string first and passing it as
// a single argument defeats that optimization:
var message = $"Processed order {order.Id} for {order.Total:C}";
_logger.LogInformation(message); // loses structured logging fields AND still allocates eagerly
```

## Good

```csharp
// Preferred: structured logging with named placeholders - the logger's
// interpolated string handler can skip formatting entirely if the log level
// is disabled, and preserves structured fields for querying in log sinks.
_logger.LogInformation("Processed order {OrderId} for {Total:C}", order.Id, order.Total);
```

## DefaultInterpolatedStringHandler Avoids Intermediate Allocations

```csharp
// .NET's interpolated string handler pattern lets APIs like Span<char>-based
// TryFormat avoid allocating a string just to copy it into a buffer.
Span<char> buffer = stackalloc char[64];
if (buffer.TryWrite($"{order.Id}: {order.Total:C}", out var written))
{
    Use(buffer[..written]); // no intermediate string allocated at all
}
```

## Interpolation Is Fine for Ordinary, Non-Hot-Path Code

```csharp
// For ordinary application code (not a proven hot path), interpolated strings
// are clear, correct, and fast enough - don't prematurely avoid them.
var message = $"Order {order.Id} total: {order.Total:C}";
```

## See Also

- [perf-stringbuilder-concat](perf-stringbuilder-concat.md) - The loop-concatenation case
- [mem-span-zero-alloc](mem-span-zero-alloc.md) - Span-based formatting without allocation
