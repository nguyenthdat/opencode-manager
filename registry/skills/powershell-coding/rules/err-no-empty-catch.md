# err-no-empty-catch

> Never catch without logging or rethrowing

## Why It Matters

Empty catch blocks silently swallow errors, leaving no trace of what went wrong. This makes failures invisible and debugging impossible. If you catch an exception, you must handle it, log it, or rethrow it. Swallowing exceptions is one of the most common and dangerous anti-patterns in any language.

## Bad

```powershell
try {
    Remove-Item 'critical.txt'
} catch {
    # Swallowed — file still exists, no one knows!
}

try {
    $data = Invoke-RestMethod -Uri $api
} catch {
    # Swallowed — $data is $null, downstream crashes with NPE
}
$data.Results  # Boom: null reference — but why?
```

## Good

```powershell
# Option 1: Log and rethrow
try {
    Remove-Item 'critical.txt' -ErrorAction Stop
} catch {
    Write-Warning "Failed to remove critical.txt: $_"
    throw
}

# Option 2: Log and continue with fallback
try {
    $data = Invoke-RestMethod -Uri $api -ErrorAction Stop
} catch {
    Write-Warning "API call failed, using cache: $_"
    $data = Get-CachedData
}

# Option 3: Intentional ignore (must comment WHY)
try {
    Remove-Item *.tmp -ErrorAction Stop
} catch [System.Management.Automation.ItemNotFoundException] {
    # Expected: no .tmp files exist — safe to ignore
    Write-Verbose "No .tmp files to clean up"
}
```

## See Also

- [err-try-catch-specific](err-try-catch-specific.md) - Catch specific exceptions
- [err-log-errors](err-log-errors.md) - Log errors properly
