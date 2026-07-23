# mod-private-functions

> Keep internal functions private with FunctionsToExport

## Why It Matters

Public functions form your module's API contract — changing them breaks consumers. Internal/private functions are implementation details that should be freely refactorable. Exporting everything forces you to maintain backward compatibility for helper functions never intended for public use.

## Bad

```powershell
# All functions exported — no distinction between public and internal
@{
    FunctionsToExport = '*'  # Everything is public API
}

# Helper functions become locked:
function Format-InternalLog { ... }     # Can't rename or change
function _parseJson { ... }             # Users depend on it
function Connect-InternalDatabase { ... } # Now must maintain compat
```

## Good

```powershell
# Public directory — exported functions
# Public/Get-User.ps1
function Get-User {
    [CmdletBinding()]
    param($Id)

    $raw = Invoke-UserApi -Id $Id  # Internal function
    ConvertFrom-UserResponse $raw   # Internal function
}

# Private directory — not exported
# Private/Invoke-UserApi.ps1
function Invoke-UserApi {
    param($Id)
    Invoke-RestMethod "https://api.corp.com/users/$Id" -Headers $script:headers
}

# Private/ConvertFrom-UserResponse.ps1
function ConvertFrom-UserResponse {
    param($Response)
    [PSCustomObject]@{ Id = $Response.user_id; Name = $Response.full_name }
}

# Module manifest
@{
    FunctionsToExport = @('Get-*', 'New-*', 'Set-*')  # Only public
}
```

## Private Function Naming Convention

```powershell
# Option 1: Verb-Noun with internal prefix (can export selectively)
function Invoke-UserApi { ... }  # Could be public if needed

# Option 2: Underscore prefix (clearly internal)
function _ConnectDb { ... }
function _ParseJson { ... }

# Option 3: Separate by directory structure
# Public/   — exported
# Private/  — dot-sourced but not exported in FunctionsToExport
```

## See Also

- [mod-exported-functions](mod-exported-functions.md) - Export control
- [proj-public-private-dirs](proj-public-private-dirs.md) - Directory layout
