# mod-exported-functions

> Use FunctionsToExport to control public API

## Why It Matters

`FunctionsToExport` declaratively defines which functions are visible to module consumers. Without it (or using wildcards like `*`), all functions — including internal helpers — leak into the user's session, polluting the namespace and breaking encapsulation. Explicit export lists are the public API contract.

## Bad

```powershell
# Everything exported (or nothing — unpredictable)
# MyModule.psd1
@{
    FunctionsToExport = '*'  # Leaks all internal helpers
}

# MyModule.psm1
function Get-User { ... }          # Public
function _validateUser { ... }     # Internal helper — LEAKED!
function _connectDb { ... }        # Internal — LEAKED!
function New-User { ... }          # Public
```

## Good

```powershell
# MyModule.psd1
@{
    FunctionsToExport = @('Get-User', 'New-User', 'Set-User', 'Remove-User')
}

# MyModule.psm1
function Get-User { [CmdletBinding()] param($Id) ... }
function New-User { [CmdletBinding()] param($Name) ... }
function Set-User { [CmdletBinding()] param($Id, $Properties) ... }
function Remove-User { [CmdletBinding()] param($Id) ... }

# Internal — not exported
function _validateUser { param($User) $User.Id -gt 0 }
function _connectDb { param($ConnectionString) ... }
```

## Wildcard Export Pattern

```powershell
# OK: Use wildcards to export all approved verb–noun functions
# while keeping internal prefixed functions hidden
@{
    FunctionsToExport = @('Get-*', 'New-*', 'Set-*', 'Remove-*', 'Test-*')
}
# Internal _helper functions not matched by wildcards

# NEVER: FunctionsToExport = '*'
```

## See Also

- [mod-private-functions](mod-private-functions.md) - Private functions
- [mod-module-scope-variables](mod-module-scope-variables.md) - Module scope
