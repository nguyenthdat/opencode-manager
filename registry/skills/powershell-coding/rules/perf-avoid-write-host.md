# perf-avoid-write-host

> Write-Host is slow; use [Console]::WriteLine or Output

## Why It Matters

`Write-Host` in PowerShell 5+ goes through the information stream and formatting engine, making it significantly slower than direct console output for high-volume output. In tight loops, `Write-Host` can be the bottleneck. Use `[Console]::WriteLine()` for raw speed or `Write-Output` for pipeline-compatible output.

## Bad

```powershell
# Write-Host in loop — very slow
1..10000 | ForEach-Object {
    Write-Host "Processing item $_"  # ~10000x formatting overhead
}

# Progress with Write-Host — blocks
for ($i = 0; $i -lt 100; $i++) {
    Start-Sleep -Milliseconds 100
    Write-Host "Progress: $i%"  # Each call is expensive
}
```

## Good

```powershell
# Fast console output — bypass formatting
1..10000 | ForEach-Object {
    [Console]::WriteLine("Processing item $_")
}

# Progress bar — Write-Progress (zero formatting overhead)
for ($i = 0; $i -le 100; $i++) {
    Start-Sleep -Milliseconds 100
    Write-Progress -Activity 'Processing' -PercentComplete $i -Status "$i%"
}

# Batch output — build string, write once
$sb = [System.Text.StringBuilder]::new()
1..1000 | ForEach-Object {
    $null = $sb.AppendLine("Item $_")
}
[Console]::Write($sb.ToString())
```

## Output Speed Comparison

```powershell
# Fastest to slowest:
[Console]::WriteLine($msg)       # ~0.001ms — raw console
Write-Output $msg                 # ~0.01ms — pipeline stream 1
$msg | Out-File log.txt -Append  # ~0.1ms — file I/O
Write-Information $msg           # ~0.5ms — information stream
Write-Host $msg                  # ~1.0ms — host + formatting
Write-Host $msg -ForegroundColor Red  # ~2.0ms — with styling
```

## See Also

- [cmd-no-write-host](cmd-no-write-host.md) - Prefer verbose streams
- [anti-write-host-logging](anti-write-host-logging.md) - Write-Host anti-pattern
