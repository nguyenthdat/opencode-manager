# cmd-supports-paging

> Implement -First/-Skip for large result sets

## Why It Matters

Functions that return large datasets without paging force memory bloat and slow pipelines. Implementing `-First`, `-Skip`, and `-IncludeTotalCount` parameters enables efficient client-side pagination and matches the behavior of cmdlets like `Select-Object`.

## Bad

```powershell
function Get-LogEntries {
    param($Path)

    # Returns ALL entries — memory explosion for large logs
    Get-Content $Path
}

# User forced to process everything
Get-LogEntries -Path huge.log  # 50 GB log file — oops
```

## Good

```powershell
function Get-LogEntries {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Path,

        [Parameter(ValueFromPipelineByPropertyName)]
        [uint64]$First,

        [Parameter(ValueFromPipelineByPropertyName)]
        [uint64]$Skip = 0,

        [switch]$IncludeTotalCount
    )

    $count = 0
    $skipped = 0

    Get-Content $Path | ForEach-Object {
        if ($skipped -lt $Skip) {
            $skipped++
            return
        }
        $count++
        $_
        if ($PSBoundParameters.ContainsKey('First') -and $count -ge $First) {
            return
        }
    }

    if ($IncludeTotalCount) {
        Write-Information "Total records: $count"
    }
}

# Usage:
Get-LogEntries -Path huge.log -First 100 -Skip 200  # Page 3, 100 per page
```

## See Also

- [cmd-single-responsibility](cmd-single-responsibility.md) - One function, one job
- [pipe-filter-left](pipe-filter-left.md) - Filter early
