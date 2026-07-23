# err-non-terminating-write

> Use Write-Error for non-terminating errors

## Why It Matters

In pipeline processing, a single bad item shouldn't stop the entire pipeline. `Write-Error` reports the problem and continues processing remaining items. It adds to the `$Error` automatic variable and can be redirected (`2>&1`) or escalated (`-ErrorAction Stop`) by the caller.

## Bad

```powershell
function ConvertTo-Lines {
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline)]
        [string]$Path
    )

    process {
        if (-not (Test-Path $Path)) {
            throw "File not found: $Path"  # Kills entire pipeline
        }
        Get-Content $Path
    }
}

# One missing file stops everything
'file1.txt', 'missing.txt', 'file3.txt' | ConvertTo-Lines
```

## Good

```powershell
function ConvertTo-Lines {
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline)]
        [ValidateScript({ Test-Path $_ })]
        [string]$Path
    )

    process {
        try {
            Get-Content $Path -ErrorAction Stop
        } catch {
            Write-Error "Failed to read '$Path': $_"
            # Continue to next pipeline item
        }
    }
}

# Missing file reported, others processed
'file1.txt', 'missing.txt', 'file3.txt' | ConvertTo-Lines
```

## Add Context to Non-Terminating Errors

```powershell
function Invoke-DataImport {
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline)]
        [string]$FilePath
    )

    process {
        try {
            Import-Csv $FilePath | ForEach-Object {
                if ([string]::IsNullOrWhiteSpace($_.Email)) {
                    Write-Error "Missing email in row of '$FilePath'"
                    return
                }
                $_
            }
        } catch {
            Write-Error "Cannot import '$FilePath': $($_.Exception.Message)"
        }
    }
}
```

## See Also

- [err-terminating-errors](err-terminating-errors.md) - Use throw for fatal errors
- [err-error-record](err-error-record.md) - Proper ErrorRecord
