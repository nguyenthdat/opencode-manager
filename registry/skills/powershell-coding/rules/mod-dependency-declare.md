# mod-dependency-declare

> Declare RequiredModules and RequiredAssemblies in manifest

## Why It Matters

Declaring dependencies in the module manifest ensures they're loaded before your module, preventing runtime errors from missing dependencies. It also enables PowerShellGet to automatically install dependencies when your module is installed. Implicit dependencies break on fresh systems and in container environments.

## Bad

```powershell
# Implicit dependency — breaks on fresh install
function Get-AzureVm {
    param($Name)

    # Assumes Az module is loaded — if not, confusing error
    Get-AzVM -Name $Name
}

# User installs your module, runs command, gets:
# "The term 'Get-AzVM' is not recognized..."
```

## Good

```powershell
# MyModule.psd1
@{
    RootModule = 'MyModule.psm1'
    ModuleVersion = '1.0.0'

    # Declare dependencies — PowerShellGet installs them automatically
    RequiredModules = @(
        @{ ModuleName = 'Az.Compute'; ModuleVersion = '7.0.0' }
        @{ ModuleName = 'Az.Resources'; ModuleVersion = '6.5.0' }
    )

    RequiredAssemblies = @(
        'System.Data.SqlClient'
        'Newtonsoft.Json.dll'
    )

    FunctionsToExport = @('Get-AzureVmSummary')
}

# Or: validate at runtime for optional dependencies
function Get-AzureVm {
    [CmdletBinding()]
    param($Name)

    if (-not (Get-Module -ListAvailable -Name Az.Compute)) {
        throw 'Az.Compute module is required. Install with: Install-Module Az.Compute'
    }

    Get-AzVM -Name $Name
}
```

## Version Pinning

```powershell
@{
    RequiredModules = @(
        @{ ModuleName = 'Pester'; ModuleVersion = '5.4.0' }
        @{ ModuleName = 'Az'; RequiredVersion = '10.0.0' }
        @{ ModuleName = 'PSReadLine'; ModuleVersion = '2.2.0'; MaximumVersion = '2.99.99' }
    )
}
# MinimumVersion: at least this version
# RequiredVersion: exactly this version
# MaximumVersion: at most this version
```

## See Also

- [mod-psm1-psd1](mod-psm1-psd1.md) - Separate code from manifest
- [mod-version-semantic](mod-version-semantic.md) - Semantic versioning
