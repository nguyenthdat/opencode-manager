# err-error-record

> Create proper ErrorRecord objects with ErrorDetails

## Why It Matters

`Write-Error "some message"` creates a bare `ErrorRecord` with minimal context. Constructing a proper `ErrorRecord` with an exception, error ID, category, and target object gives users the full diagnostic picture: `$_.FullyQualifiedErrorId`, `$_.CategoryInfo`, `$_.TargetObject`, and `$_.ErrorDetails` for actionable messages.

## Bad

```powershell
if (-not (Test-Path $configPath)) {
    Write-Error "Config not found"  # No category, no ID, no target
}
# $Error[0].FullyQualifiedErrorId is meaningless
# $Error[0].CategoryInfo is NotSpecified
```

## Good

```powershell
if (-not (Test-Path $configPath)) {
    $exception = [System.IO.FileNotFoundException]::new(
        "Configuration file not found: $configPath",
        $configPath
    )
    $errorRecord = [System.Management.Automation.ErrorRecord]::new(
        $exception,
        'ConfigFileMissing',                           # Custom error ID
        [System.Management.Automation.ErrorCategory]::ResourceUnavailable,
        $configPath                                    # Target object
    )
    $errorRecord.ErrorDetails = [System.Management.Automation.ErrorDetails]::new(
        "Run 'New-Config default' to create a default configuration file."
    )
    $PSCmdlet.WriteError($errorRecord)
}

# Now $Error[0] contains:
# FullyQualifiedErrorId: ConfigFileMissing
# CategoryInfo: ResourceUnavailable (config/app.json:String) [], FileNotFoundException
# TargetObject: config/app.json
```

## WriteError vs ThrowTerminatingError

```powershell
# Non-terminating — reports and continues
$PSCmdlet.WriteError($errorRecord)

# Terminating — stops execution, catchable
$PSCmdlet.ThrowTerminatingError($errorRecord)

# ThrowTerminatingError for: missing required resources, configuration errors
# WriteError for: individual item failures in a batch process
```

## See Also

- [err-terminating-errors](err-terminating-errors.md) - Terminating errors
- [err-non-terminating-write](err-non-terminating-write.md) - Write-Error in pipelines
