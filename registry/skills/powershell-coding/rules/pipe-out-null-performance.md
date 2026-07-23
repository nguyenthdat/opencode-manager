# pipe-out-null-performance

> Use \$null = or [void] over Out-Null for speed

## Why It Matters

`Out-Null` sends data through the PowerShell formatting system before discarding it, making it orders of magnitude slower than `$null =`, `[void]`, or `> $null`. For high-volume pipelines, `Out-Null` can be the bottleneck. Use it only when you need the formatting side effects.

## Bad

```powershell
# Out-Null is slowest — goes through formatting
Get-Process | Out-Null
$result = Invoke-Something | Out-Null  # $result = $null

# In a loop — catastrophic
1..10000 | ForEach-Object {
    Get-Process | Out-Null  # 10000x formatting overhead!
}
```

## Good

```powershell
# Assignment to $null — fastest
$null = Get-Process

# [void] cast — fast, clear intent
[void](Get-Process)

# Pipe to $null file — also fast
Get-Process > $null

# Performance ranking (fastest to slowest):
# 1. $null = <expression>            — no pipeline, no format
# 2. [void]<expression>              — clear intent, minimal overhead
# 3. <expression> > $null            — pipeline but no format
# 4. <expression> | Out-Null         — FULL format overhead
```

## When Out-Null Is Required

```powershell
# Out-Null useful ONLY when you need formatting side effects
# Example: forcing enumeration of a collection
$largeCollection | Out-Null  # Forces enumeration + format

# But even then, prefer:
$null = $largeCollection | ForEach-Object { $_ }  # Force enumeration without format
```

## See Also

- [perf-stream-over-collect](perf-stream-over-collect.md) - Stream pipeline
- [perf-pipeline-over-loops](perf-pipeline-over-loops.md) - Pipeline performance
