# cmd-no-write-host

> Prefer Write-Verbose/Write-Information over Write-Host

## Why It Matters

`Write-Host` writes directly to the host display and cannot be captured, redirected, or suppressed. `Write-Verbose` (stream 4) and `Write-Information` (stream 6) are proper output streams that users can control with `-Verbose`, `$VerbosePreference`, or redirect with `6>&1`.

## Bad

```powershell
function Invoke-Backup {
    param($Path)

    Write-Host "Starting backup of $Path"              # Can't suppress
    Write-Host "Compressing files..."                   # Can't redirect
    Write-Host "Uploading to S3..."                     # Pollutes log files
    Compress-Archive -Path $Path -DestinationPath "$Path.zip"
    Write-Host "Backup complete!"                       # Uncapturable
}
```

## Good

```powershell
function Invoke-Backup {
    [CmdletBinding()]
    param($Path)

    Write-Verbose "Starting backup of $Path"
    Write-Information "Compressing files..." -InformationAction Continue
    Write-Verbose "Uploading to S3..."

    Compress-Archive -Path $Path -DestinationPath "$Path.zip"

    Write-Verbose "Backup complete!"
}

# Control output:
Invoke-Backup -Path ./data -Verbose   # See verbose stream
Invoke-Backup -Path ./data 6>$null    # Suppress information stream
Invoke-Backup -Path ./data 4>backup.log  # Log verbose to file
```

## Stream Quick Reference

```powershell
Write-Output 'data'          # Stream 1 — pipeline data
Write-Error 'oops'           # Stream 2 — errors
Write-Warning 'careful'      # Stream 3 — warnings
Write-Verbose 'detail'       # Stream 4 — verbose
Write-Debug 'trace'          # Stream 5 — debug
Write-Information 'info'     # Stream 6 — information
Write-Host 'display'         # Host only — not redirectable (before PS 5)
```

## See Also

- [cmd-write-output](cmd-write-output.md) - Pipeline output
- [anti-write-host-logging](anti-write-host-logging.md) - Write-Host anti-pattern
