# async-avoid-task-run-server

> Avoid `Task.Run` to fake asynchrony for CPU-bound work on server request paths

## Why It Matters

`Task.Run` schedules work onto the thread pool. On a server (ASP.NET Core), the request is already running on a thread-pool thread - wrapping synchronous, CPU-bound work in `Task.Run` just moves it to a *different* thread-pool thread, adding scheduling overhead and consuming an extra thread pool slot for no throughput benefit. `Task.Run` is for offloading CPU work from a thread you need to keep responsive (like a UI thread) - a server request handler doesn't have that constraint.

## Bad

```csharp
[HttpGet("report")]
public async Task<IActionResult> GetReportAsync()
{
    // Pointless: still runs on a thread-pool thread, just a different one,
    // and consumes a second thread pool slot while it runs.
    var report = await Task.Run(() => BuildReportSynchronously());
    return Ok(report);
}
```

## Good

```csharp
[HttpGet("report")]
public IActionResult GetReport()
{
    // No fake asynchrony needed - just call the synchronous method directly
    var report = BuildReportSynchronously();
    return Ok(report);
}

// If the work is genuinely I/O-bound, make the I/O itself async instead of
// wrapping synchronous I/O in Task.Run
[HttpGet("report-async")]
public async Task<IActionResult> GetReportAsync()
{
    var report = await _reportRepository.LoadAsync(); // real async I/O, not Task.Run
    return Ok(report);
}
```

## Where Task.Run Is the Right Tool

```csharp
// Client-side / UI: offloading CPU-bound work OFF the UI thread genuinely helps
// responsiveness, because the UI thread is a scarce, single, latency-sensitive resource.
private async void OnCalculateClicked(object sender, RoutedEventArgs e)
{
    resultLabel.Text = "Calculating...";
    var result = await Task.Run(() => RunExpensiveCalculation());
    resultLabel.Text = result.ToString();
}

// Background worker: parallelizing independent CPU-bound chunks of work
public async Task<int[]> ProcessAllAsync(int[][] chunks)
{
    var tasks = chunks.Select(chunk => Task.Run(() => ProcessChunk(chunk)));
    return await Task.WhenAll(tasks);
}
```

## See Also

- [async-task-vs-valuetask](async-task-vs-valuetask.md) - Related "where should CPU work run" tradeoff
- [async-no-sync-over-async](async-no-sync-over-async.md) - The opposite mistake
