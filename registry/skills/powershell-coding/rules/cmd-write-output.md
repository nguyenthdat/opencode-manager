# cmd-write-output

> Use Write-Output for pipeline output, Write-Host only for display

## Why It Matters

`Write-Output` sends objects to the pipeline output stream (stream 1), enabling composition with downstream cmdlets. `Write-Host` bypasses the pipeline and sends directly to the host display, making it invisible to receivers. In PowerShell 5.0+, `Write-Host` became a wrapper around `Write-Information`, but its semantics remain fundamentally different from pipeline output.

## Bad

```powershell
function Get-SystemInfo {
    Write-Host "System uptime: $(Get-Uptime)"  # Lost to pipeline
    Write-Host "Hostname: $env:COMPUTERNAME"    # Can't be captured
}

$info = Get-SystemInfo  # $info is $null!
Get-SystemInfo | Export-Csv report.csv  # Empty file
```

## Good

```powershell
function Get-SystemInfo {
    [PSCustomObject]@{
        Uptime   = Get-Uptime
        Hostname = $env:COMPUTERNAME
    }
}

$info = Get-SystemInfo             # Object captured
Get-SystemInfo | Export-Csv report.csv  # Works
Get-SystemInfo | ForEach-Object { $_ } # Streams objects
```

## Legitimate Write-Host Usage

```powershell
function Invoke-Deployment {
    [CmdletBinding()]
    param()

    Write-Host "=== Deployment Started at $(Get-Date) ===" -ForegroundColor Cyan
    Write-Host "This is interactive progress for the user" -ForegroundColor Yellow

    # Actual data goes to pipeline
    [PSCustomObject]@{
        Status   = 'Success'
        Duration = $elapsed
    }
}

# Write-Host for: progress bars, interactive prompts, colored output
# Write-Output for: data, results, anything a downstream cmdlet uses
```

## See Also

- [cmd-no-write-host](cmd-no-write-host.md) - Prefer verbose streams
- [anti-write-host-logging](anti-write-host-logging.md) - Don't use Write-Host for logging
