# err-terminating-errors

> Use throw or \$PSCmdlet.ThrowTerminatingError()

## Why It Matters

Terminating errors stop execution and enter `catch` blocks, making them the right choice for unrecoverable situations. Non-terminating errors (from `Write-Error`) continue execution, potentially leaving the system in an inconsistent state. Use terminating errors when continued execution is unsafe.

## Bad

```powershell
function Set-Configuration {
    param($Path)

    if (-not (Test-Path $Path)) {
        Write-Error "Config file not found: $Path"
        return  # Just continues — caller doesn't get an exception
    }
    # ... rest of function
}

# Caller doesn't know there was a problem
Set-Configuration -Path nonexistent.json
Write-Host "Continuing..."  # Runs despite error!
```

## Good

```powershell
function Set-Configuration {
    [CmdletBinding()]
    param($Path)

    if (-not (Test-Path $Path)) {
        $errorRecord = [System.Management.Automation.ErrorRecord]::new(
            [System.IO.FileNotFoundException]::new("Config file not found: $Path"),
            'ConfigNotFound',
            [System.Management.Automation.ErrorCategory]::ResourceUnavailable,
            $Path
        )
        $PSCmdlet.ThrowTerminatingError($errorRecord)
    }
    # ... rest only runs if config exists
}

# Or simpler for most cases:
function Set-Configuration {
    [CmdletBinding()]
    param($Path)

    if (-not (Test-Path $Path)) {
        throw "Config file not found: $Path"  # Terminating error
    }
}

# Caller can catch:
try {
    Set-Configuration -Path nonexistent.json
} catch {
    Write-Warning "Configuration skipped: $_"
}
```

## Non-Terminating vs Terminating

```powershell
# Non-terminating — continues execution after reporting
Write-Error "Warning: partial failure"  # STILL continues

# Terminating — stops execution, enters catch
throw "Fatal: cannot proceed"            # STOPS and throws
```

## See Also

- [err-non-terminating-write](err-non-terminating-write.md) - Write-Error for non-terminating
- [cmd-terminating-vs-non](cmd-terminating-vs-non.md) - Intentional error action
