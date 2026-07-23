# name-parameters-PascalCase

> Use PascalCase for parameter names

## Why It Matters

PascalCase parameters match the convention of all built-in PowerShell cmdlets (`-ComputerName`, `-ErrorAction`, `-WhatIf`). Users expect this style and tools like tab completion display PascalCase. camelCase parameters look unprofessional and inconsistent.

## Bad

```powershell
function Get-Report {
    param(
        [string]$reportName,          # camelCase — non-standard
        [string]$outputPath,          # camelCase
        [int]$retryCount = 3          # camelCase
    )
}

Get-Report -reportName 'Sales' -outputPath './reports'  # Feels wrong
```

## Good

```powershell
function Get-Report {
    [CmdletBinding()]
    param(
        [string]$ReportName,          # PascalCase — standard
        [string]$OutputPath,          # PascalCase
        [int]$RetryCount = 3          # PascalCase
    )
}

Get-Report -ReportName 'Sales' -OutputPath './reports'  # Feels right

# Note: PowerShell is case-insensitive for parameter names
Get-Report -reportname 'Sales'        # Works, but use PascalCase
```

## Parameter Naming Patterns

```powershell
# Standard parameter names (match built-in conventions)
param(
    [string]$ComputerName,    # Not $Computer, $Server
    [string]$Path,            # Not $FilePath, $Location
    [string]$Name,            # Not $ItemName
    [string]$InputObject,     # Not $Input (reserved), $Data
    [string]$LiteralPath,     # For exact paths (no wildcards)
    [switch]$Force,           # Bypass confirmations/restrictions
    [switch]$PassThru,        # Return the object after modification
    [string]$Filter,          # Not $Query
    [pscredential]$Credential,# Not $Creds, $Credentials
    [string[]]$Include,       # Items to include
    [string[]]$Exclude        # Items to exclude
)
```

## See Also

- [param-typed-parameters](param-typed-parameters.md) - Parameter types
- [name-functions-Verb-Noun](name-functions-Verb-Noun.md) - Function naming
