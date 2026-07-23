# param-supports-wildcards

> Support wildcard patterns when appropriate

## Why It Matters

Users expect wildcard support in -Name, -Path, and similar parameters because built-in cmdlets support it. `Get-Process -Name *chrome*` is natural and powerful. Implementing wildcards with `-like` matching gives users flexible filtering without needing to know exact names.

## Bad

```powershell
function Get-UserReport {
    param([string]$Name)

    # Exact match only — users can't discover users
    Get-ADUser -Filter "Name -eq '$Name'"
}

Get-UserReport -Name "Smith"      # Only exact match
Get-UserReport -Name "*Smith*"    # Interprets * literally — finds nothing
```

## Good

```powershell
function Get-UserReport {
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline)]
        [SupportsWildcards()]
        [string]$Name = '*'
    )

    process {
        if ($Name -match '[\*\?\[]') {
            # Wildcard pattern — use -like
            $filter = $Name -replace '\*', '%' -replace '\?', '_'
            Get-ADUser -Filter "Name -like '$($Name -replace '\*', '*')'"
        } else {
            Get-ADUser -Filter "Name -eq '$Name'"
        }
    }
}

Get-UserReport -Name "Smith*"
Get-UserReport -Name "*admin*"
```

## Common Wildcard Parameters

```powershell
function Remove-ItemSafely {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)]
        [SupportsWildcards()]
        [string]$Path,

        [Parameter(ValueFromPipeline)]
        [SupportsWildcards()]
        [string]$Exclude
    )

    begin {
        $paths = Get-ChildItem $Path -Exclude $Exclude
    }

    process {
        foreach ($item in $paths) {
            if ($PSCmdlet.ShouldProcess($item.FullName)) {
                Remove-Item $item.FullName -Recurse -Force
            }
        }
    }
}
```

## See Also

- [param-argument-completer](param-argument-completer.md) - Tab completion
- [cmd-approved-verbs](cmd-approved-verbs.md) - Approved verbs
