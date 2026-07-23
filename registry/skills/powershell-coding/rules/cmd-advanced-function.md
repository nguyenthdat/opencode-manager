# cmd-advanced-function

> Use [CmdletBinding()] in all functions

## Why It Matters

`[CmdletBinding()]` makes a function an *advanced function*, granting access to common parameters (`-Verbose`, `-Debug`, `-ErrorAction`, `-WarningAction`, `-WhatIf`/`-Confirm`, etc.), automatic `$PSCmdlet` variable, pipeline `begin`/`process`/`end` blocks, and parameter validation attributes. Without it, none of these features work.

## Bad

```powershell
function Get-Data {
    param($Name)

    Write-Verbose "Fetching $Name"  # Never prints — no common params
    Get-Content "data\$Name.json"   # Crash on missing file, no -ErrorAction
}

Get-Data -Verbose  # Error: -Verbose parameter not found
```

## Good

```powershell
function Get-Data {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Name
    )

    Write-Verbose "Fetching $Name"
    Get-Content "data\$Name.json" -ErrorAction Stop
}

Get-Data -Verbose              # Works: prints verbose messages
Get-Data -Name "missing" -ErrorAction SilentlyContinue  # Handles gracefully
```

## Always Prefer Advanced Functions

```powershell
# Simple function — no common parameters, no pipeline
function Say-Hello { param($Name) "Hello $Name" }

# Advanced function — full PowerShell integration
function Say-Hello {
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline)]
        [string]$Name
    )
    process { "Hello $Name" }
}
```

## See Also

- [cmd-support-common](cmd-support-common.md) - Common parameter support
- [cmd-process-block](cmd-process-block.md) - begin/process/end blocks
