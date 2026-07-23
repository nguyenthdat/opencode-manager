# doc-parameter-help

> Document .PARAMETER for each parameter

## Why It Matters

`Get-Help -Parameter Name` shows parameter-specific help — but only if you documented it. Undocumented parameters leave users guessing about accepted values, defaults, pipeline behavior, and constraints. Each parameter needs its own `.PARAMETER` block with type, purpose, defaults, and pipeline info.

## Bad

```powershell
function Invoke-DataSync {
    param(
        [string]$Source,
        [string]$Destination,
        [switch]$Force,
        [int]$RetryCount,
        [hashtable]$Mapping
    )
    # Get-Help Invoke-DataSync -Parameter Mapping → nothing shown
}
```

## Good

```powershell
<#
.SYNOPSIS
    Synchronizes data between two locations.

.PARAMETER Source
    The source path to synchronize from. Can be a local folder, UNC path,
    or S3 URI (s3://bucket/prefix). Wildcards are not supported.

.PARAMETER Destination
    The destination path to synchronize to. Must be a local or UNC path.
    Parent directories are created automatically if they don't exist.

.PARAMETER Force
    Overwrites destination files even if they are newer than the source.
    By default, only older destination files are overwritten.

.PARAMETER RetryCount
    Number of times to retry failed copy operations. Default is 3.
    Set to 0 to disable retries. Each retry uses exponential backoff.

.PARAMETER Mapping
    A hashtable mapping source file patterns to destination names.
    Keys are wildcard patterns, values are replacement strings.
    Example: @{ '*.csv' = 'data-{0}.csv' }

.EXAMPLE
    Invoke-DataSync -Source '\\nas\share' -Destination 'D:\backup' -Force
#>
function Invoke-DataSync {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Source,

        [Parameter(Mandatory)]
        [string]$Destination,

        [switch]$Force,

        [ValidateRange(0, 10)]
        [int]$RetryCount = 3,

        [hashtable]$Mapping
    )
}
```

## See Also

- [doc-comment-based-help](doc-comment-based-help.md) - Comment-based help
- [doc-examples-section](doc-examples-section.md) - Examples section
