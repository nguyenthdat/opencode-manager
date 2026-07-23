# perf-stream-over-collect

> Stream pipeline results; don't collect in arrays unnecessarily

## Why It Matters

Collecting pipeline results into arrays with `$results = @()` or `+=` materializes all data in memory simultaneously. For large datasets (logs, files, database results), this can exhaust memory. Streaming through the pipeline processes items one at a time, keeping memory usage constant.

## Bad

```powershell
# Loads everything into memory — 10GB log = 10GB RAM
$allLines = Get-Content huge.log
$errorLines = @()
foreach ($line in $allLines) {
    if ($line -match 'ERROR') {
        $errorLines += $line
    }
}
$errorLines | Export-Csv errors.csv
```

## Good

```powershell
# Streams — constant memory regardless of file size
Get-Content huge.log |
    Where-Object { $_ -match 'ERROR' } |
    Export-Csv errors.csv

# Or with ForEach-Object for transformation
Get-Content huge.log |
    ForEach-Object {
        if ($_ -match 'ERROR') {
            [PSCustomObject]@{
                Timestamp = $_.Substring(0, 23)
                Message   = $_.Substring(24)
            }
        }
    } |
    Export-Csv errors.csv
```

## When Collection IS Necessary

```powershell
# Sort requires full collection — unavoidable
$results = Get-ChildItem -Recurse |
    Where-Object Length -gt 1MB |
    Sort-Object Length -Descending

# Group requires full collection — unavoidable
$grouped = Get-Process | Group-Object Company

# Count requires enumeration but not storage
$count = 0
Get-Content huge.log | ForEach-Object {
    if ($_ -match 'ERROR') { $count++ }
}
Write-Host "Found $count errors"
```

## See Also

- [pipe-foreach-object](pipe-foreach-object.md) - ForEach-Object streaming
- [perf-pipeline-over-loops](perf-pipeline-over-loops.md) - Pipeline performance
