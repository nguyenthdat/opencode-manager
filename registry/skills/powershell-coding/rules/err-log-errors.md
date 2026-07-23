# err-log-errors

> Log errors with timestamps and context

## Why It Matters

When scripts run unattended (CI/CD, scheduled tasks, services), error messages in the console are lost. Writing structured error logs with timestamps, severity, and context enables post-mortem debugging and integration with monitoring systems. Without logs, you'll only know something went wrong when users complain.

## Bad

```powershell
try {
    Import-Csv data.csv
} catch {
    Write-Host "Failed"  # Lost after terminal closes
}
```

## Good

```powershell
function Write-ErrorLog {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Message,

        [string]$ScriptName = $MyInvocation.ScriptName,

        [System.Management.Automation.ErrorRecord]$ErrorRecord
    )

    $entry = [PSCustomObject]@{
        Timestamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffK'
        Level     = 'ERROR'
        Script    = $ScriptName
        Message   = $Message
        Exception = if ($ErrorRecord) { $ErrorRecord.Exception.Message } else { '' }
    }

    $logPath = Join-Path $env:LOGS_DIR "script-errors-$(Get-Date -Format yyyyMMdd).json"

    if (-not (Test-Path (Split-Path $logPath))) {
        New-Item (Split-Path $logPath) -ItemType Directory -Force | Out-Null
    }

    $entry | Export-Csv $logPath -Append -NoTypeInformation
}

try {
    Import-Csv data.csv -ErrorAction Stop
} catch {
    Write-ErrorLog -Message "CSV import failed" -ErrorRecord $_
    throw
}
```

## Structured Logging

```powershell
# Use EventLog for system-level visibility
Write-EventLog -LogName Application -Source 'MyScript' `
    -EventId 1001 -EntryType Error `
    -Message "Import failure: $($_.Exception.Message)"

# Write structured JSON to log aggregation
$logEntry = @{
    '@timestamp' = (Get-Date).ToString('o')
    level        = 'Error'
    message      = 'CSV import failed'
    exception    = $_.Exception.ToString()
    path         = $dataPath
} | ConvertTo-Json -Compress
Add-Content -Path $logFile -Value $logEntry
```

## See Also

- [err-no-empty-catch](err-no-empty-catch.md) - Always handle catches
- [sec-audit-logging](sec-audit-logging.md) - ScriptBlock logging
