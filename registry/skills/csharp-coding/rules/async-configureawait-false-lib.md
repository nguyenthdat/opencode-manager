# async-configureawait-false-lib

> Use `ConfigureAwait(false)` in library/reusable code that doesn't need to resume on the original context

## Why It Matters

By default, `await` captures the current `SynchronizationContext` (or the current `TaskScheduler`) and resumes execution on it after the awaited task completes. UI frameworks and legacy ASP.NET (classic) rely on this to marshal back to the UI/request context. Library code has no business knowing about that context; capturing it anyway adds overhead and risks deadlocks if a caller ever blocks synchronously on the call.

## Bad

```csharp
// In a reusable library method
public async Task<string> FetchDataAsync(string url)
{
    var response = await _client.GetAsync(url); // captures caller's context
    return await response.Content.ReadAsStringAsync(); // captures it again
}
```

## Good

```csharp
public async Task<string> FetchDataAsync(string url)
{
    var response = await _client.GetAsync(url).ConfigureAwait(false);
    return await response.Content.ReadAsStringAsync().ConfigureAwait(false);
}
```

## Where It's Unnecessary

```text
- ASP.NET Core has NO SynchronizationContext by default - ConfigureAwait(false) has
  no behavioral effect there, though many teams still apply it consistently in
  shared library code that might run under other hosts (WPF, WinForms, classic ASP.NET).
- Application/UI entry-point code that intentionally needs to resume on the UI
  thread (to touch UI controls afterward) should NOT use ConfigureAwait(false).
```

## Consistent Application

```csharp
// Apply it to every await in library code, not just some - a single missed
// await can still capture the context and reintroduce the risk.
public async Task ProcessAsync(Stream stream, CancellationToken ct)
{
    using var reader = new StreamReader(stream);
    var text = await reader.ReadToEndAsync(ct).ConfigureAwait(false);
    await ValidateAsync(text, ct).ConfigureAwait(false);
    await PersistAsync(text, ct).ConfigureAwait(false);
}
```

## See Also

- [async-no-sync-over-async](async-no-sync-over-async.md) - The deadlock this specifically helps avoid
- [async-no-async-void](async-no-async-void.md) - Related async correctness rule
- [async-cancellationtoken-propagate](async-cancellationtoken-propagate.md) - Another cross-cutting async concern
