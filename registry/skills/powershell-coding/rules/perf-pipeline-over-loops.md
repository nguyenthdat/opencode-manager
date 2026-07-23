# perf-pipeline-over-loops

> Use pipeline over manual foreach loops

## Why It Matters

PowerShell's pipeline is heavily optimized in the engine — it handles streaming, memory management, and throttling internally. Manual `foreach` loops with `+=` array accumulation are O(n^2) because PowerShell arrays are immutable — each `+=` copies the entire array. The pipeline avoids this entirely.

## Bad

```powershell
# O(n^2) — array += copies entire array each iteration
$results = @()
foreach ($item in Get-ChildItem -Recurse) {
    if ($item.Length -gt 1MB) {
        $results += $item
    }
}

# Manual collection management
$results = [System.Collections.Generic.List[object]]::new()
foreach ($item in Get-ChildItem -Recurse) {
    if ($item.Length -gt 1MB) {
        $results.Add($item)
    }
}
```

## Good

```powershell
# Streaming pipeline — constant memory
Get-ChildItem -Recurse |
    Where-Object { $_.Length -gt 1MB } |
    ForEach-Object { $_ }

# Even better: filter at source
Get-ChildItem -Recurse -File |
    Where-Object Length -gt 1MB
```

## When foreach IS Better

```powershell
# For small, known-size collections, foreach is fine
$servers = @('web-01', 'web-02', 'web-03')
foreach ($server in $servers) {
    Test-Connection $server -Count 1
}

# When you need random access or indexed iteration
$lines = Get-Content config.ini  # Small file
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\[(.+)\]') { ... }
}

# When the loop body has complex logic better written imperatively
foreach ($file in Get-ChildItem *.csv) {
    $data = Import-Csv $file
    $cleaned = Remove-BadRows $data
    $aggregated = Group-ByDepartment $cleaned
    Export-Report $aggregated $file.Name
}
```

## See Also

- [perf-stream-over-collect](perf-stream-over-collect.md) - Stream over collect
- [anti-write-host-logging](anti-write-host-logging.md) - Don't use Write-Host
