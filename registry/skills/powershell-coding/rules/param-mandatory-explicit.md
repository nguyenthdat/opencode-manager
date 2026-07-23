# param-mandatory-explicit

> Mark required params [Parameter(Mandatory=\$true)]

## Why It Matters

`Mandatory=$true` tells PowerShell to prompt the user for missing required parameters rather than silently proceeding with `$null` or throwing a confusing null reference deep in your code. It also documents the function's contract clearly in help and tooling.

## Bad

```powershell
function Remove-Resource {
    param($Id, $Force)

    if (-not $Id) { throw 'Id is required' }  # Manual check — no prompt
    Write-Host "Removing $Id"
    # $Force is optional but unclear
}
```

## Good

```powershell
function Remove-Resource {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)]
        [string]$Id,

        [switch]$Force
    )

    if ($PSCmdlet.ShouldProcess($Id, 'Remove resource')) {
        Remove-Item "resources/$Id" -Recurse -Force:$Force
    }
}

# User calls:
Remove-Resource  # Prompts: "Supply values for the following parameters: Id:"
Remove-Resource -Id 'abc123'
```

## When NOT to Mark Mandatory

```powershell
# Optional parameter with sensible default
param(
    [string]$LogPath = "$env:TEMP\app.log"  # Not Mandatory, has default
)

# Parameter only needed in specific parameter sets
param(
    [Parameter(ParameterSetName = 'ByPath', Mandatory)]
    [string]$Path,

    [Parameter(ParameterSetName = 'ByName', Mandatory)]
    [string]$Name
)
```

## See Also

- [param-parameter-sets](param-parameter-sets.md) - Parameter sets
- [param-default-values](param-default-values.md) - Default values
