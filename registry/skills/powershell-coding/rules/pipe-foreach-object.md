# pipe-foreach-object

> Use ForEach-Object for stream processing

## Why It Matters

`ForEach-Object` processes each pipeline item as it arrives, enabling streaming behavior — memory usage stays constant regardless of input size. In contrast, `foreach ($item in $collection)` loads the entire collection into memory before iterating, which can exhaust memory with large datasets.

## Bad

```powershell
# Loads all 10M lines into memory
$lines = Get-Content huge.log
foreach ($line in $lines) {
    if ($line -match 'ERROR') { $line }
}

# Or: pipeline but collects everything first
(Get-Content huge.log) | Where-Object { $_ -match 'ERROR' }
```

## Good

```powershell
# Streams — constant memory
Get-Content huge.log | ForEach-Object {
    if ($_ -match 'ERROR') { $_ }
}

# Or use Where-Object directly (also streaming)
Get-Content huge.log | Where-Object { $_ -match 'ERROR' }

# ForEach-Object with begin/process/end
Get-Content huge.log | ForEach-Object -Begin {
    $errorCount = 0
} -Process {
    if ($_ -match 'ERROR') { $errorCount++; $_ }
} -End {
    Write-Verbose "Found $errorCount errors"
}
```

## When foreach Is Correct

```powershell
# Use foreach when the collection is small and you need random access
$config = Get-Content config.json | ConvertFrom-Json
foreach ($key in $config.PSObject.Properties.Name) {
    # Small collection, need indexed access
}

# Use foreach in module-level initialization (not streamed)
$defaultPaths = @( '/etc/app', '/usr/local/app', "$HOME/.app" )
foreach ($path in $defaultPaths) {
    if (Test-Path $path) { return $path }
}
```

## See Also

- [pipe-parallel-foreach](pipe-parallel-foreach.md) - Parallel ForEach
- [perf-stream-over-collect](perf-stream-over-collect.md) - Stream over collect
