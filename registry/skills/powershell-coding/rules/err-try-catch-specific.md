# err-try-catch-specific

> Catch specific exception types, not all exceptions

## Why It Matters

Catching all exceptions (`catch {}` or `catch [Exception]`) masks unexpected errors and makes debugging impossible. Specific catch blocks let you handle known failure modes while unexpected errors propagate to the caller, preserving useful stack traces and error information.

## Bad

```powershell
try {
    $data = Invoke-RestMethod -Uri $url
} catch {
    # Catches ALL exceptions: network, parsing, null ref, auth...
    Write-Warning "Something went wrong"
    $data = $null
}
```

## Good

```powershell
try {
    $data = Invoke-RestMethod -Uri $url
} catch [System.Net.WebException] {
    Write-Warning "Network error: $($_.Exception.Message)"
    $data = $null
} catch [System.UnauthorizedAccessException] {
    Write-Error "Unauthorized: check credentials"
    throw
} catch [Microsoft.PowerShell.Commands.HttpResponseException] {
    Write-Error "API returned error: $($_.ErrorDetails.Message)"
    throw
}
# Any other unexpected exception propagates uncaught
```

## Catch Multiple Types

```powershell
try {
    Connect-Database -ConnectionString $cs
} catch [System.Data.SqlClient.SqlException], [System.InvalidOperationException] {
    Write-Warning "Database unavailable: $($_.Exception.Message)"
    return $false
} catch {
    Write-Error "Unexpected error: $_"
    throw
}
```

## See Also

- [err-terminating-errors](err-terminating-errors.md) - Terminating errors
- [err-no-empty-catch](err-no-empty-catch.md) - Never empty catch
