# err-exit-code

> Set \$LASTEXITCODE or exit with non-zero for failures

## Why It Matters

CI/CD systems, scheduled tasks, and calling scripts all depend on exit codes to determine success or failure. A script that fails but exits with code 0 silently reports success. PowerShell's `throw` sets `$LASTEXITCODE` for native commands, but for script logic errors you must explicitly set an exit code.

## Bad

```powershell
# Script fails but exits 0 — CI thinks it passed
Import-Csv missing.csv  # Non-terminating error
Remove-Item ServerData  # Also fails
# Exit code: 0 — everything looks fine!
```

## Good

```powershell
$ErrorActionPreference = 'Stop'

try {
    $data = Import-Csv 'data.csv' -ErrorAction Stop
    if ($data.Count -eq 0) {
        Write-Error 'No data found in CSV'
        exit 2
    }

    Process-Data $data
    Write-Verbose 'Processing complete'
    exit 0
} catch {
    Write-Error "Fatal error: $_"
    exit 1
}
```

## Exit Code Convention

```powershell
exit 0   # Success
exit 1   # General error
exit 2   # Misuse / invalid arguments
exit 3   # File not found / resource unavailable
exit 4   # Permission denied
exit 5   # Timeout

# Check exit code from calling script:
& ./process.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Child script failed with code $LASTEXITCODE"
    exit $LASTEXITCODE
}
```

## See Also

- [err-terminating-errors](err-terminating-errors.md) - Terminating errors
- [err-erroraction-preference](err-erroraction-preference.md) - Error action
