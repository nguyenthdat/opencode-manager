# anti-write-host-logging

> Don't use Write-Host for logging/output

## Why It Matters

`Write-Host` bypasses all output streams — it can't be redirected to files, suppressed, or captured by downstream cmdlets. In automated scripts (CI/CD, scheduled tasks), `Write-Host` output disappears into the void. Use `Write-Output` for data, `Write-Information` for messages, `Write-Verbose` for debug info.

## Bad

```powershell
function Invoke-Backup {
    Write-Host "Starting backup"        # Lost in CI, can't redirect
    Write-Host "Compressing..."         # Can't capture for logs
    Write-Host "Complete!"              # Pollutes console, useless for automation
}
# CI output: nothing saved to log file
# Redirect: ./backup.ps1 *> log.txt — empty log!
```

## Good

```powershell
function Invoke-Backup {
    [CmdletBinding()]
    param()

    Write-Information "Starting backup" -InformationAction Continue
    Write-Verbose "Compressing files..."
    Write-Information "Backup complete!" -InformationAction Continue
}

# CI captures all output:
./backup.ps1 *> backup.log

# User controls verbosity:
./backup.ps1 -Verbose     # See verbose messages
./backup.ps1 -InformationAction SilentlyContinue  # Mute info messages
```

## Output Stream Guide

```powershell
# Interactive console display (NOT for scripts):
Write-Host "Colorful message" -ForegroundColor Green
# OK only in: interactive menus, progress animations, colored prompts

# Data output (goes to pipeline):
Write-Output $result
# Use for: function return values, pipeline data

# Informational messages (redirectable):
Write-Information "Processing started" -InformationAction Continue
# Use for: status messages, progress notifications

# Diagnostic details (off by default):
Write-Verbose "Connected to database: $connectionString"
# Use for: debug details, connection info, internal state
```

## See Also

- [cmd-no-write-host](cmd-no-write-host.md) - Use proper output streams
- [perf-avoid-write-host](perf-avoid-write-host.md) - Write-Host performance
